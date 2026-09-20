import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Integración de Astro que rompe el build si algún HTML lleva JavaScript dentro.
//
// La CSP de producción (workers/src/index.ts) usa `script-src 'self'`, sin
// 'unsafe-inline' ni hashes. Eso solo se sostiene mientras Astro emita todos los
// scripts como ficheros de /_astro/, que es lo que consigue
// `vite.build.assetsInlineLimit: 0` en astro.config.mjs.
//
// Si alguien quita esa opción —o añade un `is:inline`, o un onclick en una
// plantilla—, el navegador bloquearía ese código y la web se quedaría sin
// JavaScript. Aquí se detiene antes: falla `pnpm build`, y con él CI, así que no
// llega a desplegarse.

// <script> sin src, descartando los que el navegador no ejecuta (JSON-LD y
// demás bloques de datos), que la CSP tampoco bloquea.
const SCRIPT_EN_LINEA = /<script(?![^>]*\ssrc=)([^>]*)>/gi;
const TIPO = /\stype\s*=\s*["']([^"']+)["']/i;
const TIPOS_QUE_NO_EJECUTAN = /^(application\/(ld\+json|json)|text\/(template|plain))$/i;

// onclick, onerror, onload… escritos como atributos HTML: los bloquea
// script-src-attr. Ya pasó una vez con la imagen de APOD.
const ATRIBUTO_DE_EVENTO = /\son[a-z]+\s*=\s*["']/gi;

const listarHtml = async dir => {
  const entradas = await readdir(dir, { withFileTypes: true });
  const ficheros = await Promise.all(
    entradas.map(async entrada => {
      const completo = path.join(dir, entrada.name);
      if (entrada.isDirectory()) return listarHtml(completo);
      return entrada.name.endsWith('.html') ? [completo] : [];
    })
  );
  return ficheros.flat();
};

export const problemasDe = (html, fichero) => {
  const problemas = [];

  for (const coincidencia of html.matchAll(SCRIPT_EN_LINEA)) {
    const tipo = coincidencia[1].match(TIPO)?.[1] ?? '';
    if (TIPOS_QUE_NO_EJECUTAN.test(tipo)) continue;
    problemas.push(`${fichero}: <script${coincidencia[1]}> con el código dentro del HTML`);
  }

  for (const coincidencia of html.matchAll(ATRIBUTO_DE_EVENTO)) {
    problemas.push(`${fichero}: atributo${coincidencia[0].trimEnd()}…" con JavaScript dentro`);
  }

  return problemas;
};

/** @returns {import('astro').AstroIntegration} */
export default function sinScriptsEnLinea() {
  return {
    name: 'sin-scripts-en-linea',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const raiz = fileURLToPath(dir);
        const ficheros = await listarHtml(raiz);

        const problemas = (
          await Promise.all(
            ficheros.map(async fichero =>
              problemasDe(await readFile(fichero, 'utf8'), path.relative(raiz, fichero))
            )
          )
        ).flat();

        if (problemas.length === 0) return;

        throw new Error(
          [
            'Hay JavaScript escrito dentro del HTML y la CSP de producción lo bloquearía:',
            ...problemas.map(p => `  · ${p}`),
            '',
            'La web se quedaría sin esa parte del JavaScript. Opciones:',
            '  · Si falta `vite.build.assetsInlineLimit: 0` en astro.config.mjs, devuélvelo.',
            '  · Si es un `is:inline` o un onclick/onerror, muévelo a un módulo o a un listener.',
            '  · Si de verdad hace falta en línea, hay que revisar la CSP en workers/src/index.ts.',
          ].join('\n')
        );
      },
    },
  };
}

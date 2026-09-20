import { describe, expect, it } from 'vitest';
import { problemasDe } from '../../../scripts/sin-scripts-en-linea.mjs';

// Guarda de la CSP: el build falla si vuelve a colarse JavaScript dentro del
// HTML. Aquí se comprueba el detector, para que la guarda no se oxide.

const problemas = (html: string): string[] => problemasDe(html, 'index.html') as string[];

describe('detector de JavaScript dentro del HTML', () => {
  it('avisa de un <script> con el código dentro', () => {
    expect(problemas('<script type="module">console.log(1)</script>')).toHaveLength(1);
  });

  it('avisa de los atributos de evento', () => {
    expect(problemas('<img src="x" onerror="fallback()">')).toHaveLength(1);
    expect(problemas('<button onclick="ir()">ir</button>')).toHaveLength(1);
  });

  it('no molesta con los scripts externos', () => {
    expect(problemas('<script type="module" src="/_astro/index.abc.js"></script>')).toEqual([]);
  });

  it('no molesta con los bloques de datos, que el navegador no ejecuta', () => {
    expect(problemas('<script type="application/ld+json">{"@type":"Person"}</script>')).toEqual([]);
  });

  it('encuentra varios a la vez y dice de qué fichero son', () => {
    const encontrados = problemas('<script>a()</script><div onmouseover="b()"></div>');
    expect(encontrados).toHaveLength(2);
    expect(encontrados.every(p => p.startsWith('index.html:'))).toBe(true);
  });
});

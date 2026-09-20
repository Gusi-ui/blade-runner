# WARP.md

Guía para WARP (warp.dev) —y para cualquier agente— al trabajar en este repositorio.

## Qué es este proyecto

Web personal de Gusi (<https://gusi.dev>): página estática pensada primero para móvil
(proyectos, servicios, contacto) con una **terminal interactiva** que se abre en una capa
encima y contiene las funciones de laboratorio (noticias, APOD de la NASA, chat con IA,
juegos, calculadora cósmica).

- **Frontend:** Astro 7 (salida estática), Tailwind CSS 4 (tokens en `src/styles/tokens.css`,
  no hay `tailwind.config`), TypeScript estricto, ESM.
- **Backend y hosting:** un único Cloudflare Worker (`workers/src/index.ts`) sirve la web
  (`dist/` como static assets) **y** la API en `/api/*`. No hay GitHub Pages, Vercel ni Netlify.
- **Servicios:** KV (caché), Workers AI (chat y traducción), Email (formulario de contacto)
  y Turnstile (anti-bots del formulario).

## Comandos

```bash
pnpm dev            # servidor de desarrollo en http://localhost:4321
pnpm build          # type-check + build a dist/
pnpm preview        # previsualiza dist/
pnpm lint           # ESLint con --fix     | pnpm lint:check
pnpm format         # Prettier             | pnpm format:check
pnpm type-check     # astro check
pnpm test           # Vitest (unitarios)
pnpm test:e2e       # Playwright con la API simulada
pnpm test:e2e:live  # Playwright contra una web real (E2E_BASE_URL=…)
```

- Un solo test unitario: `pnpm test -- src/lib/calculator/calculator.test.ts`
  (o `pnpm test -- -t "nombre del caso"`).
- Un solo test de navegador: `pnpm test:e2e -- e2e/site.spec.ts -g "contacto"`.
- En macOS 13 no hay Chromium de Playwright: usa `PW_CHANNEL=chrome pnpm test:e2e`.
- Worker: `pnpm --filter ./workers dev` para levantarlo en local; despliegues, en CI.

## Entorno

- Node 22+ y pnpm 10+ (CI usa la misma versión; conviene igualarla en local).
- `.env` (copia de `.env.example`) solo necesita apuntar a la API:
  ```env
  PUBLIC_API_BASE_URL=https://dev.gusi.dev
  ```
- Las claves (NASA, Guardian, Turnstile, correo) son **secrets del Worker**, nunca `.env`:
  todo lo que empieza por `PUBLIC_` acaba en el JavaScript del visitante.

## Arquitectura

- `src/data/` — perfil, servicios y proyectos: fuente única de contenido para la página y
  para los comandos de la terminal.
- `src/pages/index.astro` — la web. `src/pages/terminal-vistas.astro` — plantillas que la
  terminal descarga bajo demanda (excluida de `robots.txt`).
- `src/components/site/` — secciones de la página; `TerminalSheet.astro` — la capa.
- `src/lib/terminal/` — controlador, registro de comandos, rutas por hash, carga perezosa.
  La página envía ~5 KB de JS; el código de la terminal solo se descarga al abrirla.
- `src/lib/views/` — una vista por función (news, apod, chat, games, calculator), cada una
  con un `install()` idempotente.
- `src/lib/calculator/` — la calculadora cósmica en módulos pequeños con tests.
- `src/lib/{api,contact,site,games,ai}/` — cliente de la API, formulario + Turnstile, etc.
- `src/styles/` — `global.css` es la única entrada de Tailwind; `tokens.css` define colores
  y fuentes; `site.css` y `terminal.css` el resto.
- `workers/` — el Worker: rutas estáticas + `/api/*`, cabeceras de caché y seguridad,
  redirección www → apex. Configuración en `workers/wrangler.jsonc`.
- `e2e/` — tests de navegador con la API simulada (`e2e/fixtures.ts`).

## Flujo de trabajo

```
feat/xxx ──PR──► develop ──► https://dev.gusi.dev
                    └──PR «release»──► main ──► https://gusi.dev
```

- `main` y `develop` están protegidas: se entra por PR y con el check `verify` en verde
  (lint, formato, tipos, tests, build, e2e y dry-run del Worker).
- Cada merge despliega el Worker del entorno y pasa los e2e contra la URL ya desplegada.
- Los merges y los despliegues requieren autorización explícita del propietario.
- Detalles en [DEPLOYMENT.md](DEPLOYMENT.md).

## Convenciones

- ESLint plano (`eslint.config.mjs`) + Prettier con los plugins de Astro y Tailwind.
- Husky + lint-staged en el pre-commit (`pnpm exec lint-staged`).
- Nunca `git add -A`: añade rutas explícitas (así se coló una vez `workers/.wrangler`).
- **Nada de JavaScript dentro del HTML** (ni `is:inline`, ni `onclick`/`onerror`): la CSP de
  producción usa `script-src 'self'` y lo bloquearía. `pnpm build` falla si aparece, gracias a
  `scripts/sin-scripts-en-linea.mjs`; eso depende de `vite.build.assetsInlineLimit: 0`.
- Los mensajes de commit van en español; usa heredoc si contienen backticks.

# gusi.dev

Web personal de Gusi (Jose Martínez), desarrollador full stack: una página pensada primero para el móvil con proyectos, servicios y contacto, y una **terminal interactiva** de estética Blade Runner que se abre encima y trae las funciones «de laboratorio» (noticias, foto de la NASA, chat con IA, juegos, calculadora cósmica).

- **En producción:** <https://gusi.dev>
- **Staging:** <https://dev.gusi.dev> (no indexado)

![Astro](https://img.shields.io/badge/Astro-7-orange.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020.svg)

## Cómo está montado

Un único Cloudflare Worker (`blade-runner-api`) sirve **la web** (los ficheros estáticos de `dist/`) **y la API** (`/api/*`), en `gusi.dev/*` y `www.gusi.dev/*` (que redirige al dominio sin www).

```
navegador ──► Worker blade-runner-api
                ├── /api/*  → APOD, noticias, traducción, chat IA, contacto
                └── resto   → web estática (dist/), con sus cabeceras de caché y seguridad
```

- **Frontend:** Astro 7 (salida estática), Tailwind CSS 4, TypeScript.
- **Backend:** Cloudflare Workers + KV (caché) + Workers AI (chat y traducción) + Email (formulario).
- **Terminal bajo demanda:** la página carga ~5 KB de JavaScript; el código de la terminal y de sus vistas se descarga solo al abrirla, junto con sus plantillas (`/terminal-vistas/`).
- **Datos de contenido:** `src/data/` (perfil, servicios y proyectos) alimenta a la vez la página y los comandos de la terminal.

## Empezar

Requisitos: Node 22+ y pnpm 10+.

```bash
pnpm install
pnpm dev        # web en http://localhost:4321
```

Para que funcionen noticias, APOD, chat y contacto hace falta apuntar a una API. Copia `.env.example` a `.env` y define:

```env
# API del Worker: https://gusi.dev en producción, https://dev.gusi.dev para probar contra staging
PUBLIC_API_BASE_URL=https://dev.gusi.dev
```

Las claves de NASA, Guardian, Stripe y demás **no van aquí**: viven como _secrets_ del Worker. Cualquier variable `PUBLIC_*` acaba en el JavaScript que ve el visitante.

## Comandos

| Comando                 | Acción                                              |
| ----------------------- | --------------------------------------------------- |
| `pnpm dev`              | Servidor de desarrollo en `localhost:4321`          |
| `pnpm build`            | Comprueba tipos y construye `dist/`                 |
| `pnpm test`             | Tests unitarios (Vitest)                            |
| `pnpm test:e2e`         | Tests de navegador (Playwright) con la API simulada |
| `pnpm test:e2e:live`    | Los mismos contra una web real (`E2E_BASE_URL=…`)   |
| `pnpm lint:check`       | ESLint sin corregir                                 |
| `pnpm format:check`     | Prettier en modo comprobación                       |
| `pnpm capture:projects` | Regenera las capturas de los proyectos              |

En macOS 13 los tests de navegador necesitan el Chrome instalado: `PW_CHANNEL=chrome pnpm test:e2e`.

## La terminal

Se abre tocando la terminal «viva» de la portada, o con un enlace directo: `gusi.dev/#apod`, `#news`, `#chat`, `#juegos`, `#calculadora`. Se cierra con ✕, `Esc` o el botón «atrás».

- **Destacados:** `proyectos`, `sobre-mi` (alias `cv`), `contacto`.
- **Laboratorio:** `news [ai|cosmos|all]`, `apod [fecha|random]`, `chat`, `ask <pregunta>`, `juegos [1-4]`, `guess`, `edad <fecha>`, `calculadora`, `theme`, `config`, `status`, `history`, `clear`, `exit`.
- Autocompletado con Tab, historial con ↑/↓ y atajos táctiles según la vista.
- Hay algún easter egg escondido.

## Estructura

```
src/
├── data/            # perfil, servicios y proyectos (fuente única de contenido)
├── components/
│   ├── site/        # secciones de la página (cabecera, portada, proyectos…)
│   ├── TerminalSheet.astro  # capa a pantalla completa
│   └── …            # plantillas de las vistas de la terminal
├── lib/
│   ├── terminal/    # controlador, comandos, capa, atajos
│   ├── views/       # código de cada vista (se carga al abrir la terminal)
│   ├── calculator/  # calculadora cósmica, en módulos probados
│   ├── api/ contact/ site/ games/ ai/
├── pages/
│   ├── index.astro          # la web
│   └── terminal-vistas.astro # plantillas que descarga la terminal
└── styles/          # tokens.css (colores y fuentes), site.css, terminal.css
workers/             # el Worker: web estática + API
e2e/                 # tests de navegador
docs/superpowers/    # especificación y plan del rediseño
```

## Despliegue y flujo de trabajo

```
feat/xxx ──PR──► develop ──► https://dev.gusi.dev
                    └──PR «release»──► main ──► https://gusi.dev
```

Cada merge despliega el Worker correspondiente y ejecuta los tests de navegador contra la URL ya desplegada. `main` y `develop` están protegidas: se entra por PR y con el check `verify` en verde. Los detalles están en [DEPLOYMENT.md](DEPLOYMENT.md).

## Licencia

Sin licencia abierta: © Jose Martínez (Gusi). Todos los derechos reservados. El código está publicado para consulta; si quieres reutilizar alguna parte, escríbeme.

## Contacto

[gusi.dev](https://gusi.dev) · [github.com/Gusi-ui](https://github.com/Gusi-ui)

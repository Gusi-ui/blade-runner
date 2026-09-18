# Rediseño de gusi.dev — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la terminal a pantalla completa actual por una página estática, pensada primero para móvil y orientada a captar clientes, con una terminal «viva» que abre la terminal completa (todas las funciones actuales) en una capa a pantalla completa.

**Architecture:** `index.astro` pasa a componerse de secciones Astro estáticas que leen de `src/data/*`. El `TerminalController` existente se conserva y se monta dentro de un `<dialog>` (`TerminalSheet`) que se abre desde la terminal viva o desde enlaces con hash (`#apod`…). Los colores se centralizan en tokens `@theme` de Tailwind 4 y las clases heredadas `*-terminal-*` se reasignan a esos tokens, de modo que las vistas cambian de aspecto sin reescribir sus plantillas.

**Tech Stack:** Astro 7 (salida estática), Tailwind CSS 4, TypeScript 6, Vitest 5, Playwright 1.63, Cloudflare Workers (static assets), pnpm 10.

**Spec:** `docs/superpowers/specs/2026-09-18-rediseno-gusi-dev-design.md`

## Global Constraints

- Todo el texto visible, los comentarios y los mensajes de commit en **español**.
- Colores (exactos): `bg #0b0d10`, `surface #0f1317`, `surface-2 #11151a`, `border #1f262e`, `border-strong #2b333d`, `text #c9d1db`, `text-strong #f5f7fa`, `muted #6b7684`, `accent #4ade80`, `accent-ink #04140a`.
- Tipografías: **Space Grotesk** (texto) y **JetBrains Mono** (terminal y etiquetas técnicas), autoalojadas con `@fontsource-variable/space-grotesk@^5.3.0` y `@fontsource-variable/jetbrains-mono@^5.3.0`. Nada de Google Fonts.
- Móvil primero: diseñar a 390 px de ancho; `sm` 640, `md` 768, `lg` 1024.
- Con `prefers-reduced-motion: reduce`: sin animación de escritura ni transiciones.
- Contraste WCAG AA en todos los textos.
- Ninguna dependencia de ejecución nueva salvo las dos de fuentes.
- Cada fase es una rama desde `develop` y una PR contra `develop` (squash). La release `develop → main` se mergea con **merge commit**.
- Antes de cada commit: `pnpm lint:check && pnpm format:check && pnpm test` en verde. Nunca `git add -A` (añadir ficheros explícitos).
- Pruebas e2e locales en macOS 13: `PW_CHANNEL=chrome pnpm test:e2e`.
- Hashes de sección de la página: `proyectos`, `sobre-mi`, `contacto`. Nunca abren la terminal.

---

## Mapa de ficheros

| Fichero                                                               | Responsabilidad                                                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/styles/tokens.css` (nuevo)                                       | Tokens `@theme`, fuentes, alias `terminal-*`.                                                            |
| `src/styles/site.css` (nuevo)                                         | Estilos base de la página (secciones, botones, tarjetas).                                                |
| `src/styles/terminal.css` (reescrito en fase 3)                       | Estilos de la terminal dentro de la capa.                                                                |
| `src/data/profile.ts`, `services.ts`, `projects.ts` (nuevos)          | Contenido único para página y terminal.                                                                  |
| `src/assets/projects/*.png` (nuevos)                                  | Capturas de los proyectos (Astro genera WebP).                                                           |
| `scripts/capture-projects.mjs` (nuevo)                                | Genera las capturas con Playwright.                                                                      |
| `src/layouts/BaseLayout.astro` (nuevo)                                | `<head>`, SEO, JSON-LD, registro del service worker.                                                     |
| `src/components/site/*.astro` (nuevos)                                | `SiteHeader`, `Hero`, `LiveTerminal`, `ProjectsSection`, `AboutSection`, `ContactSection`, `SiteFooter`. |
| `src/components/TerminalSheet.astro` (nuevo)                          | `<dialog>` que envuelve `Terminal.astro`.                                                                |
| `src/lib/terminal/hashRoute.ts` (nuevo)                               | Decide qué hace cada hash (sección, terminal, vista).                                                    |
| `src/lib/terminal/sheet.ts` (nuevo)                                   | Abrir/cerrar la capa, historial, `Esc`, atrás.                                                           |
| `src/lib/terminal/chips.ts` (nuevo)                                   | Atajos contextuales por vista.                                                                           |
| `src/lib/terminal/contentCommands.ts` (nuevo)                         | Comandos `proyectos` y `sobre-mi` desde `src/data`.                                                      |
| `src/lib/contact/form.ts` (nuevo)                                     | Envío del formulario de contacto (extraído de `Contact.astro`).                                          |
| `src/lib/terminal/controller.ts`                                      | Scroll dentro de la capa, hash → capa, sin foco automático.                                              |
| `src/lib/terminal/commands.ts`, `registry.ts`                         | Grupos de ayuda, alias `cv`/`menu`, `contacto` → página.                                                 |
| `e2e/fixtures.ts`, `e2e/terminal.spec.ts`, `e2e/site.spec.ts` (nuevo) | Pruebas de navegador.                                                                                    |

---

# FASE 1 · Base

Rama: `git switch -c feat/rediseno-base develop`

### Task 1: Tokens de diseño y fuentes autoalojadas

**Files:**

- Create: `src/styles/tokens.css`
- Modify: `src/styles/terminal.css:1-2`
- Delete: `tailwind.config.mjs`
- Modify: `package.json` (dependencias)
- Test: `e2e/terminal.spec.ts` (prueba «los estilos se aplican…»)

**Interfaces:**

- Produces: utilidades Tailwind `bg-bg`, `bg-surface`, `bg-surface-2`, `border-line`, `border-line-strong`, `text-body`, `text-strong`, `text-muted`, `text-accent`, `bg-accent`, `text-accent-ink`, `font-sans` (Space Grotesk), `font-mono` (JetBrains Mono). Las clases `*-terminal-{bg,text,dim,bright}` siguen existiendo con sus colores actuales (se reasignan en la Task 9).

- [ ] **Step 1: Instalar las fuentes**

```bash
pnpm add -w @fontsource-variable/space-grotesk@^5.3.0 @fontsource-variable/jetbrains-mono@^5.3.0
```

- [ ] **Step 2: Crear `src/styles/tokens.css`**

```css
/* Tokens de diseño de gusi.dev (spec §3). Única fuente de colores y fuentes. */
@import '@fontsource-variable/space-grotesk';
@import '@fontsource-variable/jetbrains-mono';

@theme {
  --color-bg: #0b0d10;
  --color-surface: #0f1317;
  --color-surface-2: #11151a;
  --color-line: #1f262e;
  --color-line-strong: #2b333d;
  --color-body: #c9d1db;
  --color-strong: #f5f7fa;
  --color-muted: #6b7684;
  --color-accent: #4ade80;
  --color-accent-ink: #04140a;

  /* Colores heredados de la terminal: se reasignan a los tokens en la fase 3. */
  --color-terminal-bg: #000000;
  --color-terminal-text: #00ff41;
  --color-terminal-dim: #008f11;
  --color-terminal-bright: #39ff14;

  --font-sans: 'Space Grotesk Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;

  --animate-blink: blink 1s step-end infinite;
  @keyframes blink {
    from,
    to {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
}
```

Nota: los nombres `line`/`body`/`strong` evitan utilidades confusas como `border-border`. La spec llama `--color-border` y `--color-text*` a los mismos valores.

- [ ] **Step 3: Sustituir `@config` en `src/styles/terminal.css`**

Cambiar las dos primeras líneas:

```css
@import 'tailwindcss';
@import './tokens.css';
```

y borrar `tailwind.config.mjs` (`git rm tailwind.config.mjs`). La animación `typewriter` del config no se usa (`grep -rn "animate-typewriter" src` no devuelve nada); `animate-blink` queda en `tokens.css`.

- [ ] **Step 4: Verificar que la terminal actual se ve igual**

Run: `pnpm build && PW_CHANNEL=chrome pnpm test:e2e --project=desktop`
Expected: todas las pruebas en verde (la terminal sigue verde sobre negro; la prueba de estilos pasa).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/styles/tokens.css src/styles/terminal.css tailwind.config.mjs
git commit -m "feat(estilos): tokens @theme y fuentes autoalojadas; fuera tailwind.config"
```

### Task 2: Datos de perfil, servicios y proyectos

**Files:**

- Create: `src/data/profile.ts`, `src/data/services.ts`, `src/data/projects.ts`
- Test: `src/data/data.test.ts`

**Interfaces:**

- Produces:
  - `profile: Profile` con `{ name: string; role: string; headline: string; headlineAccent: string; intro: string; about: string[]; email: string; github: string; stack: string[] }`
  - `services: Service[]` con `{ title: string; description: string; price: string; priceNote: string; href: string }` y `ALAMIA_URL` (tarifas iguales a alamia.es: el contenido definitivo está en `src/data/services.ts` de la fase 1, que sustituye al del Step 3)
  - `projects: Project[]` con `{ slug: string; name: string; url: string; summary: string; tags: string[]; featured: boolean }`
  - `featuredProjects(): Project[]`

- [ ] **Step 1: Escribir la prueba que falla** (`src/data/data.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { profile } from './profile';
import { featuredProjects, projects } from './projects';
import { services } from './services';

describe('datos del sitio', () => {
  it('los proyectos tienen slug único y URL https', () => {
    const slugs = projects.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of projects) expect(p.url).toMatch(/^https:\/\//);
  });

  it('los destacados son las 4 webs reales de la spec', () => {
    expect(featuredProjects().map(p => p.slug)).toEqual([
      'viandalucia',
      'divermataro',
      'irenepuigdemont',
      'alamia',
    ]);
  });

  it('hay 3 servicios con título y descripción', () => {
    expect(services).toHaveLength(3);
    for (const s of services) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.description.length).toBeGreaterThan(10);
    }
  });

  it('el perfil tiene email y GitHub válidos', () => {
    expect(profile.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    expect(profile.github).toMatch(/^https:\/\/github\.com\//);
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `pnpm exec vitest run src/data`
Expected: FAIL («Failed to resolve import "./profile"»).

- [ ] **Step 3: Crear los datos**

`src/data/profile.ts`:

```ts
// Contenido de «Sobre mí». BORRADOR: el usuario debe validar los textos antes de la release.
export interface Profile {
  name: string;
  role: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  about: string[];
  email: string;
  github: string;
  stack: string[];
}

export const profile: Profile = {
  name: 'Gusi',
  role: 'Desarrollador Full Stack',
  headline: 'Webs rápidas y a medida para tu',
  headlineAccent: 'negocio',
  intro:
    'Diseño, desarrollo y mantenimiento con Astro, TypeScript y Cloudflare. Migraciones desde WordPress.',
  about: [
    'Soy Gusi, desarrollador full stack. Construyo webs para negocios, asociaciones y profesionales que necesitan algo rápido, seguro y fácil de mantener.',
    'Trabajo de principio a fin: diseño, desarrollo, puesta en marcha y mantenimiento, y hablo contigo en tu idioma, sin tecnicismos.',
  ],
  email: 'webmaster@gusi.dev',
  github: 'https://github.com/Gusi-ui',
  stack: ['Astro', 'TypeScript', 'Cloudflare Workers', 'Tailwind CSS', 'IA'],
};
```

`src/data/services.ts`:

```ts
export interface Service {
  title: string;
  description: string;
}

export const services: Service[] = [
  {
    title: 'Webs a medida',
    description: 'Rápidas, accesibles y fáciles de mantener, pensadas primero para el móvil.',
  },
  {
    title: 'Migración desde WordPress',
    description: 'Tu web de siempre, más rápida y sin plugins ni sustos de seguridad.',
  },
  {
    title: 'Mantenimiento y hosting',
    description: 'Alojamiento en Cloudflare con copias de seguridad y monitorización.',
  },
];
```

`src/data/projects.ts`:

```ts
// Proyectos reales en producción. `summary`: BORRADOR, a validar por el usuario.
export interface Project {
  slug: string;
  name: string;
  url: string;
  summary: string;
  tags: string[];
  featured: boolean;
}

export const projects: Project[] = [
  {
    slug: 'viandalucia',
    name: 'viandalucia.org',
    url: 'https://viandalucia.org',
    summary:
      'Web de asociación migrada desde WordPress: más rápida y sin mantenimiento de plugins.',
    tags: ['Astro', 'Workers', 'R2', 'Turnstile'],
    featured: true,
  },
  {
    slug: 'divermataro',
    name: 'divermataro.org',
    url: 'https://divermataro.org',
    summary: 'Web de club de buceo con gestión de contenidos propia.',
    tags: ['Astro', 'D1', 'Workers'],
    featured: true,
  },
  {
    slug: 'irenepuigdemont',
    name: 'irenepuigdemont.com',
    url: 'https://irenepuigdemont.com',
    summary: 'Web profesional con contenidos editables y carga instantánea.',
    tags: ['Astro', 'D1', 'KV'],
    featured: true,
  },
  {
    slug: 'alamia',
    name: 'alamia.es',
    url: 'https://alamia.es',
    summary: 'Web corporativa con formulario de contacto seguro en el borde.',
    tags: ['Workers', 'KV'],
    featured: true,
  },
];

export const featuredProjects = (): Project[] => projects.filter(p => p.featured);
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `pnpm exec vitest run src/data`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat(datos): perfil, servicios y proyectos reales como fuente única"
```

### Task 3: Capturas de los proyectos

**Files:**

- Create: `scripts/capture-projects.mjs`
- Create: `src/assets/projects/{viandalucia,divermataro,irenepuigdemont,alamia}.png`
- Modify: `eslint.config.mjs` (globals de Node para `scripts/`), `package.json` (script)

**Interfaces:**

- Consumes: `projects` (Task 2) — se leen `slug` y `url`.
- Produces: `src/assets/projects/<slug>.png` a 1280×800, importables con `import img from '../../assets/projects/<slug>.png'`.

- [ ] **Step 1: Crear el script**

```js
// Captura la portada de cada proyecto (1280×800) en src/assets/projects/<slug>.png.
// Uso: PW_CHANNEL=chrome pnpm capture:projects   (Astro las convierte a WebP en el build)
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const targets = [
  ['viandalucia', 'https://viandalucia.org'],
  ['divermataro', 'https://divermataro.org'],
  ['irenepuigdemont', 'https://irenepuigdemont.com'],
  ['alamia', 'https://alamia.es'],
];

await mkdir('src/assets/projects', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
for (const [slug, url] of targets) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `src/assets/projects/${slug}.png` });
  console.log(`✓ ${slug}`);
}
await browser.close();
```

(La lista se duplica a propósito: el script es `.mjs` sin compilación y no puede importar `projects.ts`. La prueba del Step 3 comprueba que coinciden.)

Añadir a `package.json` → `scripts`: `"capture:projects": "node scripts/capture-projects.mjs"`.

- [ ] **Step 2: Generar las capturas**

Run: `PW_CHANNEL=chrome pnpm capture:projects`
Expected: 4 líneas `✓ <slug>` y 4 PNG en `src/assets/projects/`. Revisar visualmente cada una (sin banners de cookies tapando la web; si los hay, repetir tras aceptar manualmente o recortar).

- [ ] **Step 3: Prueba de coherencia** (añadir a `src/data/data.test.ts`)

```ts
import { existsSync } from 'node:fs';

it('cada proyecto tiene su captura', () => {
  for (const p of projects) {
    expect(existsSync(`src/assets/projects/${p.slug}.png`)).toBe(true);
  }
});
```

Run: `pnpm exec vitest run src/data` → PASS (5 tests).

- [ ] **Step 4: Commit y PR de la fase 1**

```bash
git add scripts/capture-projects.mjs src/assets/projects/ src/data/data.test.ts package.json eslint.config.mjs
git commit -m "feat(proyectos): capturas de las 4 webs con Playwright"
git push -u origin feat/rediseno-base
gh pr create --base develop --title "feat(rediseño): fase 1 · tokens, fuentes y datos"
```

---

# FASE 2 · Página nueva y terminal en capa

Rama: `git switch -c feat/rediseno-pagina develop` (tras mergear la fase 1).

### Task 4: `BaseLayout` con SEO

**Files:**

- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro` (usa el layout; se quitan partículas y prevención de zoom)
- Test: `e2e/site.spec.ts`

**Interfaces:**

- Consumes: `profile`, `services` (Task 2).
- Produces: `<BaseLayout title description>` con `<slot />` en `<body class="bg-bg text-body font-sans">`.

- [ ] **Step 1: Prueba que falla** (`e2e/site.spec.ts`)

```ts
import { expect, test } from '@playwright/test';

test.describe('página', () => {
  test('el HTML servido incluye el contenido profesional y el JSON-LD', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Webs rápidas y a medida');
    expect(html).toContain('"@type":"ProfessionalService"');
    expect(html).toContain('<meta name="description"');
  });
});
```

Run: `PW_CHANNEL=chrome pnpm test:e2e e2e/site.spec.ts` → FAIL.

- [ ] **Step 2: Crear `src/layouts/BaseLayout.astro`**

```astro
---
import { profile } from '../data/profile';
import { services } from '../data/services';

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.role,
      url: 'https://gusi.dev',
      email: `mailto:${profile.email}`,
      sameAs: [profile.github],
    },
    {
      '@type': 'ProfessionalService',
      name: 'gusi.dev',
      url: 'https://gusi.dev',
      areaServed: 'ES',
      description,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios',
        itemListElement: services.map(s => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: s.title, description: s.description },
        })),
      },
    },
  ],
};
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content={description} />
    <meta name="author" content={profile.name} />
    <meta name="theme-color" content="#0b0d10" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="canonical" href="https://gusi.dev/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://gusi.dev/" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:image" content="https://gusi.dev/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <title>{title}</title>
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)}></script>
  </head>
  <body class="bg-bg text-body font-sans antialiased">
    <slot />
    <script>
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    </script>
  </body>
</html>
```

- [ ] **Step 3: `index.astro` usa el layout**

Envolver el contenido actual del `<body>` en `<BaseLayout title="Gusi · Desarrollador Full Stack — webs rápidas y a medida" description="Webs rápidas y a medida para negocios y asociaciones: desarrollo con Astro y Cloudflare, migraciones desde WordPress y mantenimiento.">`. Eliminar del `index.astro`: el `<head>` completo, `#particles` y `generateParticles`, el listener `touchend` que impide el zoom y el JSON-LD `WebApplication`. Conservar la lectura de `nexus-theme`/`nexus-reduced-effects` en un `<script>`. Añadir al principio del body, temporalmente, un `<h1 class="sr-only">Webs rápidas y a medida para tu negocio</h1>` (lo sustituye el `Hero` en la Task 5).

- [ ] **Step 4: Verificar**

Run: `PW_CHANNEL=chrome pnpm test:e2e` → todo en verde (incluida la nueva prueba).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/index.astro e2e/site.spec.ts
git commit -m "feat(página): BaseLayout con SEO orientado a servicios y JSON-LD"
```

### Task 5: `TerminalSheet` — la terminal actual dentro de una capa

**Files:**

- Create: `src/lib/terminal/hashRoute.ts`, `src/lib/terminal/hashRoute.test.ts`
- Create: `src/lib/terminal/sheet.ts`
- Create: `src/components/TerminalSheet.astro`
- Modify: `src/lib/terminal/controller.ts` (`scrollToBottom`, `navigateToHash`, `loadView`, foco inicial)
- Modify: `src/components/Terminal.astro` (sin arranque automático ni reloj)
- Modify: `src/types/terminal.d.ts`
- Modify: `e2e/fixtures.ts` (`Terminal.open`)
- Test: `e2e/site.spec.ts`

**Interfaces:**

- Produces:
  - `type HashTarget = { kind: 'none' } | { kind: 'section'; id: string } | { kind: 'terminal' } | { kind: 'view'; token: string }`
  - `classifyHash(hash: string, isViewToken: (token: string) => boolean): HashTarget`
  - `SECTION_IDS: readonly ['proyectos', 'sobre-mi', 'contacto']`
  - `window.terminalSheet: { open(command?: string): void; close(): void; isOpen(): boolean }`
  - Atributo `data-open-terminal` (y opcional `data-command="apod"`) en cualquier elemento abre la capa.
  - `<dialog id="terminal-sheet">` contiene `#output-scroll` (contenedor con scroll) y dentro `#output-container`.

- [ ] **Step 1: Prueba unitaria que falla** (`src/lib/terminal/hashRoute.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { classifyHash } from './hashRoute';

const isView = (t: string) => ['news', 'apod', 'cv', 'juegos', 'menu'].includes(t);

describe('classifyHash', () => {
  it.each([
    ['', { kind: 'none' }],
    ['#', { kind: 'none' }],
    ['#proyectos', { kind: 'section', id: 'proyectos' }],
    ['#sobre-mi', { kind: 'section', id: 'sobre-mi' }],
    ['#contacto', { kind: 'section', id: 'contacto' }],
    ['#projects', { kind: 'section', id: 'proyectos' }],
    ['#terminal', { kind: 'terminal' }],
    ['#apod', { kind: 'view', token: 'apod' }],
    ['#/news', { kind: 'view', token: 'news' }],
    ['#APOD', { kind: 'view', token: 'apod' }],
    ['#desconocido', { kind: 'none' }],
  ])('%s', (hash, expected) => {
    expect(classifyHash(hash, isView)).toEqual(expected);
  });
});
```

Run: `pnpm exec vitest run src/lib/terminal/hashRoute` → FAIL.

- [ ] **Step 2: Implementar `src/lib/terminal/hashRoute.ts`**

```ts
// Qué hace cada hash de la URL: ir a una sección de la página, abrir la terminal
// o abrir la terminal en una vista concreta (#apod, #news…).

export const SECTION_IDS = ['proyectos', 'sobre-mi', 'contacto'] as const;

// Enlaces antiguos que ahora son secciones de la página.
const LEGACY_SECTIONS: Record<string, string> = { projects: 'proyectos', contact: 'contacto' };

export type HashTarget =
  | { kind: 'none' }
  | { kind: 'section'; id: string }
  | { kind: 'terminal' }
  | { kind: 'view'; token: string };

export const classifyHash = (hash: string, isViewToken: (token: string) => boolean): HashTarget => {
  const token = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (!token) return { kind: 'none' };
  if ((SECTION_IDS as readonly string[]).includes(token)) return { kind: 'section', id: token };
  if (LEGACY_SECTIONS[token]) return { kind: 'section', id: LEGACY_SECTIONS[token] };
  if (token === 'terminal') return { kind: 'terminal' };
  if (isViewToken(token)) return { kind: 'view', token };
  return { kind: 'none' };
};
```

Run: `pnpm exec vitest run src/lib/terminal/hashRoute` → PASS (11 tests).

- [ ] **Step 3: `src/lib/terminal/sheet.ts`**

```ts
// Capa a pantalla completa de la terminal (<dialog id="terminal-sheet">).
// Abrir añade una entrada al historial (#terminal o la vista): «atrás», ✕ y Esc cierran.

export interface TerminalSheetApi {
  open(command?: string): void;
  close(): void;
  isOpen(): boolean;
}

export type TerminalSheet = TerminalSheetApi & { show(): void; hide(): void };

export const createTerminalSheet = (
  dialog: HTMLDialogElement,
  run: (command: string) => void,
  focusInput: () => void
): TerminalSheet => {
  let scrollY = 0;

  const show = (): void => {
    if (dialog.open) return;
    scrollY = window.scrollY;
    dialog.showModal();
    document.documentElement.classList.add('sheet-open');
    focusInput();
  };

  const hide = (): void => {
    if (!dialog.open) return;
    dialog.close();
    document.documentElement.classList.remove('sheet-open');
    window.scrollTo({ top: scrollY });
  };

  const api: TerminalSheetApi = {
    open(command) {
      if (!dialog.open)
        history.pushState({ sheet: true }, '', command ? `#${command}` : '#terminal');
      show();
      if (command) run(command);
    },
    close() {
      // Si la abrimos nosotros, «atrás» deja la URL como estaba; si se entró con
      // un enlace directo (#apod), se limpia el hash sin salir de la web.
      if (history.state?.sheet) history.back();
      else {
        history.replaceState(null, '', location.pathname + location.search);
        hide();
      }
    },
    isOpen: () => dialog.open,
  };

  // Esc: el <dialog> dispara «cancel»; lo convertimos en close() para mantener el historial.
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    api.close();
  });
  window.addEventListener('popstate', () => {
    if (!history.state?.sheet && !/^#(terminal|[a-z])/i.test(location.hash)) hide();
  });
  document.addEventListener('click', e => {
    const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-open-terminal]');
    if (!trigger) return;
    e.preventDefault();
    api.open(trigger.dataset.command);
  });

  return Object.assign(api, { show, hide });
};
```

Nota para el implementador: `show`/`hide` (tipo `TerminalSheet`) se exponen además para que el controlador abra la capa al entrar con un hash de vista sin añadir otra entrada al historial.

- [ ] **Step 4: `src/components/TerminalSheet.astro`**

```astro
---
import Terminal from './Terminal.astro';
---

<dialog id="terminal-sheet" class="terminal-sheet" aria-label="Terminal Nexus-7">
  <header class="terminal-sheet__bar">
    <button
      type="button"
      class="terminal-sheet__close"
      data-close-terminal
      aria-label="Cerrar terminal"
    >
      ✕
    </button>
    <span class="terminal-sheet__path font-mono">
      nexus-7{' '}
      <span id="sheet-path" class="text-muted">
        ~/
      </span>
    </span>
  </header>
  <div id="output-scroll" class="terminal-sheet__body">
    <Terminal />
  </div>
</dialog>

<style is:global>
  .terminal-sheet {
    position: fixed;
    inset: 0;
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--color-terminal-bg);
    color: var(--color-terminal-text);
  }
  .terminal-sheet[open] {
    display: flex;
    flex-direction: column;
  }
  .terminal-sheet::backdrop {
    background: rgb(0 0 0 / 0.7);
  }
  @media (min-width: 1024px) {
    .terminal-sheet {
      inset: 5vh auto;
      width: min(960px, 92vw);
      height: 90vh;
      border: 1px solid var(--color-line-strong);
      border-radius: 14px;
    }
  }
  .terminal-sheet__bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-line);
  }
  .terminal-sheet__close {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-line-strong);
  }
  .terminal-sheet__body {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  html.sheet-open {
    overflow: hidden;
  }
</style>
```

- [ ] **Step 5: Cambios en el controlador** (`src/lib/terminal/controller.ts`)

1. `scrollToBottom()` → desplaza el contenedor de la capa:

```ts
private scrollToBottom(): void {
  const scroller = document.getElementById('output-scroll');
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
}
```

2. `navigateToHash()` usa `classifyHash` y abre la capa sin nueva entrada de historial:

```ts
private navigateToHash(): void {
  const target = classifyHash(location.hash, token => {
    const spec = this.registry.resolveToken(token);
    return !!spec && (!!spec.view || spec.name === 'menu');
  });
  if (target.kind === 'section' || target.kind === 'none') return;
  window.terminalSheet?.show?.();
  if (target.kind === 'terminal' || target.token === this.currentView) return;
  const spec = this.registry.resolveToken(target.token);
  if (spec) void this.executeCommand(spec.name);
}
```

3. En `loadView()`, sustituir `location.hash = view` por `history.replaceState(history.state, '', `#${view}`)` (cambiar de vista dentro de la capa no debe llenar el historial: «atrás» cierra la capa).
4. Quitar el `this.input.focus()` inicial y el listener global `focusInputFromTap` sobre `document`; registrar ese mismo listener sobre `document.getElementById('terminal-sheet')`.
5. Importar `classifyHash` desde `./hashRoute`.

Y en `Terminal.astro`, en el `<script>`: crear la capa y exponerla:

```ts
import { createTerminalSheet } from '../lib/terminal/sheet';
// …tras window.terminal = new TerminalController();
const dialog = document.getElementById('terminal-sheet') as HTMLDialogElement;
const input = document.getElementById('terminal-input') as HTMLInputElement;
window.terminalSheet = createTerminalSheet(
  dialog,
  cmd => window.terminal?.run?.(cmd),
  () => input.focus()
);
document
  .querySelector('[data-close-terminal]')
  ?.addEventListener('click', () => window.terminalSheet?.close());
```

y cambiar `runBootSequence(bootOutput)` por `renderBootInstant(bootOutput)` (la animación de arranque no aporta dentro de una capa que se abre bajo demanda).

En `src/types/terminal.d.ts`, añadir a `Window`:

```ts
terminalSheet?: { open(command?: string): void; close(): void; isOpen(): boolean; show?(): void; hide?(): void };
```

- [ ] **Step 6: `index.astro` monta la capa**

Sustituir `<Terminal />` por `<TerminalSheet />` y añadir temporalmente, bajo el `<h1>`, `<button type="button" data-open-terminal>Abrir terminal</button>` (lo sustituye `LiveTerminal` en la Task 6).

- [ ] **Step 7: Adaptar el fixture e2e** (`e2e/fixtures.ts`, clase `Terminal`)

```ts
async open(path = '/'): Promise<void> {
  await this.page.goto(path);
  const dialog = this.page.locator('#terminal-sheet');
  if (!(await dialog.evaluate(d => (d as HTMLDialogElement).open))) {
    await this.page.locator('[data-open-terminal]').first().click();
  }
  await expect(dialog).toBeVisible();
  await expect(this.input).toBeVisible();
}
```

En la prueba «los estilos se aplican…», sustituir `await expect(page.getByText('Sistema listo')).toBeVisible();` por `await expect(page.locator('main, h1').first()).toBeAttached();` y comprobar el borde sobre `.terminal-sheet` en lugar de `.terminal-screen` (tras abrirla con `[data-open-terminal]`).

- [ ] **Step 8: Pruebas e2e de la capa** (añadir a `e2e/site.spec.ts`)

```ts
test.describe('terminal en capa', () => {
  test('se abre al tocar y se cierra con ✕, Esc y atrás', async ({ page }) => {
    await page.goto('/');
    const sheet = page.locator('#terminal-sheet');
    await expect(sheet).toBeHidden();

    await page.locator('[data-open-terminal]').first().click();
    await expect(sheet).toBeVisible();
    await page.locator('[data-close-terminal]').click();
    await expect(sheet).toBeHidden();

    await page.locator('[data-open-terminal]').first().click();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    await page.locator('[data-open-terminal]').first().click();
    await page.goBack();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });

  test('un enlace #apod abre la terminal en esa vista', async ({ page }) => {
    await page.goto('/#apod');
    await expect(page.locator('#terminal-sheet')).toBeVisible();
    await expect(page.locator('#output-container')).toContainText('Imagen Astronómica');
  });

  test('un enlace de sección no abre la terminal', async ({ page }) => {
    await page.goto('/#contacto');
    await expect(page.locator('#terminal-sheet')).toBeHidden();
  });
});
```

(`#contacto` aún no existe como sección; la prueba ya es válida porque solo exige que la capa no se abra.)

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → todo en verde.

- [ ] **Step 9: Commit**

```bash
git add src/lib/terminal/hashRoute.ts src/lib/terminal/hashRoute.test.ts src/lib/terminal/sheet.ts src/components/TerminalSheet.astro src/components/Terminal.astro src/lib/terminal/controller.ts src/types/terminal.d.ts src/pages/index.astro e2e/
git commit -m "feat(terminal): la terminal pasa a una capa a pantalla completa con historial"
```

### Task 6: `SiteHeader`, `Hero` y `LiveTerminal`

**Files:**

- Create: `src/styles/site.css`
- Create: `src/components/site/SiteHeader.astro`, `Hero.astro`, `LiveTerminal.astro`
- Create: `src/lib/site/liveTerminal.ts`, `src/lib/site/liveTerminal.test.ts`
- Modify: `src/pages/index.astro`
- Test: `e2e/site.spec.ts`

**Interfaces:**

- Consumes: `profile` (Task 2), `featuredProjects()` (Task 2), `data-open-terminal` (Task 5).
- Produces: `LIVE_SCRIPT: { cmd: string; out: string }[]`; `renderLive(el: HTMLElement, script, opts: { instant: boolean }): Promise<void>`; clases `.btn-primary`, `.btn-secondary`, `.kicker`, `.section`, `.card` en `site.css`.

- [ ] **Step 1: Prueba unitaria que falla** (`src/lib/site/liveTerminal.test.ts`)

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { buildLiveScript, renderLive } from './liveTerminal';

describe('terminal viva', () => {
  it('el guion usa los datos reales', () => {
    const script = buildLiveScript({ name: 'Gusi', role: 'Full Stack', stack: ['astro', 'ts'] }, 4);
    expect(script.map(l => l.cmd)).toEqual(['whoami', 'stack', 'proyectos --count']);
    expect(script[2].out).toBe('4 webs en producción');
  });

  it('en modo instantáneo pinta todo sin esperar', async () => {
    const el = document.createElement('div');
    await renderLive(el, [{ cmd: 'whoami', out: 'Gusi' }], { instant: true });
    expect(el.textContent).toContain('$ whoami');
    expect(el.textContent).toContain('Gusi');
  });
});
```

Si `happy-dom` no está instalado: `pnpm add -Dw happy-dom@^20` (solo desarrollo). Run: `pnpm exec vitest run src/lib/site` → FAIL.

- [ ] **Step 2: `src/lib/site/liveTerminal.ts`**

```ts
// Terminal «viva» del Hero: escribe unos comandos de demostración.
// Con prefers-reduced-motion se muestra ya escrita (spec §3).

export interface LiveLine {
  cmd: string;
  out: string;
}

export const buildLiveScript = (
  p: { name: string; role: string; stack: string[] },
  projectCount: number
): LiveLine[] => [
  { cmd: 'whoami', out: `${p.name} · ${p.role}` },
  { cmd: 'stack', out: p.stack.map(s => s.toLowerCase()).join(' · ') },
  { cmd: 'proyectos --count', out: `${projectCount} webs en producción` },
];

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const line = (el: HTMLElement, cls: string, text: string): HTMLElement => {
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = text;
  el.appendChild(div);
  return div;
};

export const renderLive = async (
  el: HTMLElement,
  script: LiveLine[],
  opts: { instant: boolean }
): Promise<void> => {
  el.textContent = '';
  for (const { cmd, out } of script) {
    const prompt = line(el, 'live-cmd', '$ ');
    if (opts.instant) prompt.textContent = `$ ${cmd}`;
    else
      for (const ch of cmd) {
        prompt.textContent += ch;
        await wait(55);
      }
    if (!opts.instant) await wait(250);
    line(el, 'live-out', out);
  }
  line(el, 'live-cursor', '$ ');
};
```

Run: `pnpm exec vitest run src/lib/site` → PASS.

- [ ] **Step 3: `src/styles/site.css`** (importar desde `index.astro` después de `terminal.css`)

```css
@import './tokens.css';

@layer components {
  .section {
    @apply mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-20;
  }
  .kicker {
    @apply text-accent mb-2 font-mono text-xs;
  }
  .section-heading {
    @apply text-strong mb-6 text-2xl font-bold tracking-tight sm:text-3xl;
  }
  .btn-primary {
    @apply bg-accent text-accent-ink inline-flex min-h-11 items-center justify-center rounded-xl px-5 font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent);
  }
  .btn-secondary {
    @apply border-line-strong text-strong inline-flex min-h-11 items-center justify-center rounded-xl border px-5 transition-colors hover:border-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent);
  }
  .card {
    @apply bg-surface border-line rounded-2xl border p-4;
  }
  .tag {
    @apply bg-surface-2 border-line-strong text-muted rounded-md border px-2 py-0.5 font-mono text-xs;
  }
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 4.5rem;
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

- [ ] **Step 4: Componentes**

`src/components/site/SiteHeader.astro`:

```astro
<header class="bg-bg/90 border-line sticky top-0 z-20 border-b backdrop-blur">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
    <a href="/" class="text-strong text-lg font-bold">
      gusi<span class="text-accent">.dev</span>
    </a>
    <nav class="flex items-center gap-5 text-sm" aria-label="Principal">
      <a href="#proyectos" class="text-muted hover:text-strong hidden sm:inline">
        Proyectos
      </a>
      <a href="#sobre-mi" class="text-muted hover:text-strong hidden sm:inline">
        Sobre mí
      </a>
      <a href="#contacto" class="btn-primary min-h-9 rounded-full px-4 text-sm" data-cta="header">
        Contactar
      </a>
    </nav>
  </div>
</header>
```

`src/components/site/LiveTerminal.astro`:

```astro
---
import { profile } from '../../data/profile';
import { featuredProjects } from '../../data/projects';
import { buildLiveScript } from '../../lib/site/liveTerminal';
const script = buildLiveScript(profile, featuredProjects().length);
---

<button
  type="button"
  data-open-terminal
  class="live-terminal card w-full p-0 text-left font-mono text-sm"
  aria-label="Abrir la terminal interactiva"
>
  <span class="border-line flex items-center gap-1.5 border-b px-3 py-2" aria-hidden="true">
    <i class="bg-line-strong size-2 rounded-full"></i>
    <i class="bg-line-strong size-2 rounded-full"></i>
    <i class="bg-line-strong size-2 rounded-full"></i>
    <span class="text-muted ml-auto text-xs">nexus-7</span>
  </span>
  <span class="block min-h-36 px-3 py-3 leading-7" data-live-output>
    {script.map(l => (
      <>
        <span class="live-cmd block">$ {l.cmd}</span>
        <span class="live-out text-strong block">{l.out}</span>
      </>
    ))}
  </span>
  <span class="border-line text-accent flex justify-between border-t px-3 py-2 text-xs">
    <span>▶ Toca para usar la terminal</span>
    <span class="text-muted">help</span>
  </span>
</button>

<script>
  import { profile } from '../../data/profile';
  import { featuredProjects } from '../../data/projects';
  import { buildLiveScript, renderLive } from '../../lib/site/liveTerminal';
  const el = document.querySelector<HTMLElement>('[data-live-output]');
  const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (el && !instant)
    void renderLive(el, buildLiveScript(profile, featuredProjects().length), { instant });
</script>

<style>
  .live-cmd {
    color: var(--color-accent);
  }
  :global(.live-cursor)::after {
    content: '▌';
    animation: var(--animate-blink);
  }
</style>
```

(El HTML inicial ya lleva el guion completo: sin JS o con movimiento reducido se ve escrito; con JS se re-anima.)

`src/components/site/Hero.astro`:

```astro
---
import { profile } from '../../data/profile';
import LiveTerminal from './LiveTerminal.astro';
---

<section class="section grid items-center gap-8 pt-8 lg:grid-cols-2 lg:pt-16">
  <div>
    <p class="kicker">// {profile.role.toLowerCase()}</p>
    <h1 class="text-strong text-[2rem] leading-tight font-bold tracking-tight sm:text-5xl">
      {profile.headline} <span class="text-accent">{profile.headlineAccent}</span>.
    </h1>
    <p class="text-muted mt-4 max-w-prose text-base sm:text-lg">{profile.intro}</p>
    <div class="mt-6 grid grid-cols-2 gap-3 sm:flex">
      <a href="#contacto" class="btn-primary" data-cta="hero">
        Hablemos
      </a>
      <a href="#proyectos" class="btn-secondary">
        Ver proyectos
      </a>
    </div>
  </div>
  <LiveTerminal />
</section>
```

- [ ] **Step 5: `index.astro`**: quitar el `<h1 class="sr-only">` y el botón temporal; el body queda `<SiteHeader /><main><Hero /></main><TerminalSheet />` + componentes ocultos de vistas.

- [ ] **Step 6: Pruebas e2e** (añadir a `e2e/site.spec.ts`)

```ts
test('la presentación y los botones llevan a su sitio', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Webs rápidas');
  await expect(page.locator('[data-cta="header"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hablemos' })).toHaveAttribute('href', '#contacto');
});

test('con movimiento reducido la terminal viva aparece ya escrita', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('[data-live-output]')).toContainText('webs en producción');
  await ctx.close();
});
```

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → verde.

- [ ] **Step 7: Commit**

```bash
git add src/styles/site.css src/components/site/ src/lib/site/ src/pages/index.astro e2e/site.spec.ts package.json pnpm-lock.yaml
git commit -m "feat(página): cabecera, presentación y terminal viva"
```

### Task 7: Proyectos, Sobre mí, Contacto y pie

**Files:**

- Create: `src/components/site/ProjectsSection.astro`, `AboutSection.astro`, `ContactSection.astro`, `SiteFooter.astro`
- Create: `src/lib/contact/form.ts` (script movido desde `src/components/Contact.astro`)
- Modify: `src/components/Contact.astro` (importa `../lib/contact/form`), `src/pages/index.astro`
- Test: `e2e/site.spec.ts`

**Interfaces:**

- Consumes: `featuredProjects()`, `profile`, `services`, capturas de la Task 3.
- Produces: secciones con `id="proyectos"`, `id="sobre-mi"`, `id="contacto"`; el formulario de la página usa `data-contact-form` y `data-contact-status` (mismo contrato que el actual).

- [ ] **Step 1: Mover la lógica del formulario**

Crear `src/lib/contact/form.ts` con el listener de `submit` delegado que hoy está en el `<script>` de `Contact.astro` (desde `document.addEventListener('submit', …` hasta el final), exportado como `installContactForm(): void` y protegido para instalarse una sola vez (`let installed = false`). En `Contact.astro` y `ContactSection.astro`: `<script>import { installContactForm } from '../lib/contact/form'; installContactForm();</script>` (ruta `../../lib/contact/form` desde `site/`). Cambiar las clases de estado a `text-muted` / `text-accent` / `text-red-400` en vez de `text-terminal-dim` / `success-text` / `error-text`.

- [ ] **Step 2: `ProjectsSection.astro`**

```astro
---
import { Image } from 'astro:assets';
import { featuredProjects } from '../../data/projects';
const shots = import.meta.glob<{ default: ImageMetadata }>('../../assets/projects/*.png', {
  eager: true,
});
const shotFor = (slug: string) => shots[`../../assets/projects/${slug}.png`].default;
---

<section id="proyectos" class="section">
  <p class="kicker">// proyectos</p>
  <h2 class="section-heading">Webs en producción</h2>
  <ul class="grid gap-4 md:grid-cols-2">
    {featuredProjects().map(p => (
      <li class="card flex flex-col gap-3">
        <Image
          src={shotFor(p.slug)}
          alt={`Portada de ${p.name}`}
          widths={[640, 1280]}
          sizes="(min-width: 768px) 480px, 100vw"
          class="border-line aspect-[16/10] w-full rounded-xl border object-cover object-top"
          loading="lazy"
        />
        {p.label && <span class="tag text-accent w-fit">{p.label}</span>}
        <h3 class="text-strong text-lg font-semibold">
          <a href={p.url} rel="noopener" target="_blank" class="hover:text-accent">
            {p.name} ↗
          </a>
        </h3>
        <p class="text-muted">{p.summary}</p>
        <div class="flex flex-wrap gap-1.5">
          {p.tags.map(t => (
            <span class="tag">{t}</span>
          ))}
        </div>
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 3: `AboutSection.astro`**

```astro
---
import { profile } from '../../data/profile';
import { ALAMIA_URL, services } from '../../data/services';
---

<section id="sobre-mi" class="section">
  <p class="kicker">// sobre mí</p>
  <h2 class="section-heading">Hola, soy {profile.name}</h2>
  <div class="grid gap-8 lg:grid-cols-2">
    <div class="space-y-4 text-base">
      {profile.about.map(p => (
        <p>{p}</p>
      ))}
    </div>
    <ol class="divide-line divide-y">
      {services.map((s, i) => (
        <li class="flex gap-4 py-4">
          <span class="text-accent font-mono text-sm">{String(i + 1).padStart(2, '0')}</span>
          <div class="flex-1">
            <div class="flex items-baseline justify-between gap-3">
              <h3 class="text-strong font-semibold">{s.title}</h3>
              <span class="text-strong font-mono whitespace-nowrap">
                {s.price} <span class="text-muted text-xs">{s.priceNote}</span>
              </span>
            </div>
            <p class="text-muted">{s.description}</p>
            {s.href === ALAMIA_URL ? (
              <a
                href={s.href}
                target="_blank"
                rel="noopener"
                class="text-accent mt-1 inline-block text-sm"
              >
                Contratar en alamia.es ↗
              </a>
            ) : (
              <a href={s.href} class="text-accent mt-1 inline-block text-sm">
                Pedir presupuesto →
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>
```

- [ ] **Step 4: `ContactSection.astro`**

```astro
---
import { profile } from '../../data/profile';
---

<section id="contacto" class="section">
  <p class="kicker">// contacto</p>
  <h2 class="section-heading">¿Tienes un proyecto?</h2>
  <form data-contact-form class="grid max-w-xl gap-3" novalidate>
    <label class="grid gap-1 text-sm">
      Nombre
      <input name="name" required maxlength="100" autocomplete="name" class="field" />
    </label>
    <label class="grid gap-1 text-sm">
      Email
      <input
        name="email"
        type="email"
        required
        maxlength="200"
        autocomplete="email"
        class="field"
      />
    </label>
    <label class="grid gap-1 text-sm">
      ¿Qué necesitas?
      <textarea
        name="message"
        required
        minlength="5"
        maxlength="2000"
        rows="5"
        class="field"
      ></textarea>
    </label>
    <input
      name="website"
      type="text"
      tabindex="-1"
      autocomplete="off"
      class="hidden"
      aria-hidden="true"
    />
    <button type="submit" class="btn-primary">
      Enviar mensaje
    </button>
    <p data-contact-status class="text-sm" role="status" aria-live="polite"></p>
  </form>
  <p class="text-muted mt-6 text-sm">
    <a href={`mailto:${profile.email}`} class="hover:text-strong">
      {profile.email}
    </a>{' '}
    ·{' '}
    <a href={profile.github} class="hover:text-strong">
      GitHub
    </a>
  </p>
</section>

<script>
  import { installContactForm } from '../../lib/contact/form';
  installContactForm();
</script>

<style>
  .field {
    background: var(--color-surface);
    border: 1px solid var(--color-line-strong);
    border-radius: 0.75rem;
    padding: 0.7rem 0.8rem;
    color: var(--color-strong);
    font-size: 1rem; /* ≥16px: iOS no hace zoom al enfocar */
  }
  .field:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
</style>
```

- [ ] **Step 5: `SiteFooter.astro`**

```astro
<footer class="border-line text-muted border-t py-8 text-center font-mono text-xs">
  © {new Date().getFullYear()} gusi.dev · escribe{' '}
  <button type="button" data-open-terminal data-command="help" class="text-accent underline">
    help
  </button>{' '}
  en la terminal
</footer>
```

- [ ] **Step 6: `index.astro`**: `<main><Hero /><ProjectsSection /><AboutSection /><ContactSection /></main><SiteFooter />`.

- [ ] **Step 7: Pruebas e2e** (añadir a `e2e/site.spec.ts`; la del formulario usa los mocks, así que importar `test` desde `./fixtures` en ese `describe`)

```ts
test('secciones visibles y «Hablemos» lleva al formulario', async ({ page }) => {
  await page.goto('/');
  for (const id of ['proyectos', 'sobre-mi', 'contacto']) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await expect(page.locator('#proyectos li')).toHaveCount(4);
  await page.getByRole('link', { name: 'Hablemos' }).click();
  await expect(page.locator('#contacto form')).toBeInViewport();
});
```

y en `e2e/terminal.spec.ts`, sustituir la prueba «el formulario de contacto envía el mensaje» por la misma interacción sobre `page.locator('#contacto form')` (sin abrir la terminal).

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → verde.

- [ ] **Step 8: Commit, PR de la fase 2 y revisión en staging**

```bash
git add src/components/site/ src/lib/contact/ src/components/Contact.astro src/pages/index.astro e2e/
git commit -m "feat(página): proyectos, sobre mí, contacto y pie"
git push -u origin feat/rediseno-pagina
gh pr create --base develop --title "feat(rediseño): fase 2 · página nueva y terminal en capa"
```

Tras el merge, comprobar en `https://dev.gusi.dev` desde un móvil real (iOS y Android) y pedir al usuario que valide los textos de `src/data/*`.

---

# FASE 3 · Terminal con el aspecto nuevo

Rama: `git switch -c feat/rediseno-terminal develop`

### Task 8: Colores heredados → tokens y nuevo `terminal.css`

**Files:**

- Modify: `src/styles/tokens.css` (alias `terminal-*`)
- Rewrite: `src/styles/terminal.css`
- Modify: `src/lib/terminal/configMenu.ts` (temas por variables)
- Test: `e2e/terminal.spec.ts`

**Interfaces:**

- Produces: temas vía `html[data-theme="retro|cyberpunk|phosphor"]` que redefinen `--color-accent`; clases de terminal conservadas: `.terminal-output`, `.terminal-input-line`, `.terminal-prompt`, `.terminal-input`, `.section-title`, `.menu-item`, `.success-text`, `.error-text`, `.game-canvas`, `.touch-controls`, `.touch-btn`, `.touch-btn-wide`, `.loading-dots`, `.sr-only`, `.contact-input`, `.contact-submit`, `.contact-honeypot`.

- [ ] **Step 1: Prueba que falla** (añadir a `e2e/terminal.spec.ts`)

```ts
test('la terminal usa la paleta nueva', async ({ terminal, page }) => {
  await terminal.run('help');
  const colors = await page.evaluate(() => {
    const sheet = document.getElementById('terminal-sheet')!;
    const bright = document.querySelector('#output-container .text-terminal-bright')!;
    return { bg: getComputedStyle(sheet).backgroundColor, bright: getComputedStyle(bright).color };
  });
  expect(colors.bg).toBe('rgb(11, 13, 16)');
  expect(colors.bright).toBe('rgb(245, 247, 250)');
});
```

Run → FAIL (fondo negro, verde neón).

- [ ] **Step 2: Reasignar los alias en `tokens.css`**

```css
--color-terminal-bg: var(--color-bg);
--color-terminal-text: var(--color-body);
--color-terminal-dim: var(--color-muted);
--color-terminal-bright: var(--color-strong);
```

y añadir, fuera de `@theme`, los temas:

```css
html[data-theme='retro'] {
  --color-accent: #fbbf24;
}
html[data-theme='cyberpunk'] {
  --color-accent: #22d3ee;
}
html[data-theme='phosphor'] {
  --color-accent: #e5e7eb;
}
```

- [ ] **Step 3: Reescribir `src/styles/terminal.css`**

Sustituir el fichero entero por estilos limitados a la capa (sin `text-shadow`, sin `.crt-flicker`, `.scanline`, `.particles`, `.glitch`, ASCII ni `.menu-row`):

```css
@import 'tailwindcss';
@import './tokens.css';

@layer components {
  .terminal-sheet .terminal-output {
    @apply mb-3 text-[0.95rem] leading-relaxed;
  }
  .terminal-sheet .section-title {
    @apply text-strong mb-3 font-sans text-lg font-semibold;
  }
  .terminal-sheet .menu-item {
    @apply bg-surface-2 border-line-strong text-body hover:border-accent inline-flex min-h-10 items-center rounded-lg border px-3 text-sm transition-colors;
  }
  .terminal-sheet .success-text {
    @apply text-accent;
  }
  .terminal-sheet .error-text {
    @apply text-red-400;
  }
  .terminal-sheet .loading-dots::after {
    content: '…';
    animation: var(--animate-blink);
  }
  .terminal-sheet [class*='border-terminal'] {
    border-radius: 0.75rem;
  }

  .terminal-input-line {
    @apply bg-bg border-line sticky bottom-0 flex items-center gap-2 border-t px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))];
  }
  .terminal-prompt {
    @apply text-accent font-mono text-sm whitespace-nowrap;
  }
  .terminal-input-wrap {
    @apply bg-surface-2 border-line-strong flex min-h-11 flex-1 items-center rounded-xl border px-3;
  }
  .terminal-input {
    @apply text-strong w-full bg-transparent font-mono text-base outline-none;
    caret-color: var(--color-accent);
  }
  .terminal-send {
    @apply bg-accent text-accent-ink size-11 rounded-xl font-bold;
  }

  .game-canvas {
    @apply border-line-strong mx-auto max-w-full rounded-xl border;
    image-rendering: pixelated;
  }
  .touch-controls {
    @apply mx-auto mt-3 grid max-w-xs grid-cols-3 gap-2;
  }
  .touch-btn {
    @apply bg-surface-2 border-line-strong flex min-h-12 min-w-12 items-center justify-center rounded-xl border text-lg;
  }
  .touch-btn-wide {
    grid-column: span 3;
  }

  .contact-input {
    @apply bg-surface border-line-strong text-strong w-full rounded-xl border px-3 py-2 text-base;
  }
  .contact-honeypot {
    @apply hidden;
  }
  .sr-only {
    @apply sr-only;
  }
}

@media (prefers-reduced-motion: reduce) {
  .terminal-sheet * {
    animation: none !important;
    transition: none !important;
  }
}
```

Antes de borrar, comprobar con `grep -rn "class=\"[^\"]*\bNOMBRE\b" src` que ninguna clase eliminada se usa en `src/scripts/*.ts` o componentes; si se usa, añadir su regla equivalente en este fichero.

- [ ] **Step 4: Temas por atributo** (`src/lib/terminal/configMenu.ts`, `applyTheme`)

```ts
const selected = theme && THEMES[theme] ? theme : 'classic';
if (selected === 'classic') delete document.documentElement.dataset.theme;
else document.documentElement.dataset.theme = selected;
localStorage.setItem('nexus-theme', selected);
```

y en `index.astro`, al cargar: `const t = localStorage.getItem('nexus-theme'); if (t && t !== 'classic') document.documentElement.dataset.theme = t;` (dentro de `try/catch`). Renombrar la etiqueta de `classic` a `'Clásico (verde)'`.

- [ ] **Step 5: Verificar**

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → verde. Revisar a ojo en móvil (Playwright `--project=mobile --headed` o staging): noticias, APOD, chat, juegos (Snake y Tetris con controles táctiles), calculadora.

- [ ] **Step 6: Commit**

```bash
git add src/styles/ src/lib/terminal/configMenu.ts src/pages/index.astro e2e/terminal.spec.ts
git commit -m "feat(terminal): paleta nueva, estilos limpios y temas por variables"
```

### Task 9: Ayuda en dos grupos y comandos de contenido

**Files:**

- Modify: `src/lib/terminal/registry.ts` (`group`)
- Create: `src/lib/terminal/contentCommands.ts`
- Modify: `src/lib/terminal/commands.ts`, `src/lib/terminal/commands.test.ts`
- Modify: `src/components/CV.astro` / `Projects.astro` (dejan de registrarse; se borran en la Task 13)

**Interfaces:**

- Produces: `CommandSpec.group?: 'featured' | 'lab'` (por defecto `'lab'`); `buildContentCommands(): CommandSpec[]` con `proyectos` (alias `projects`, `3`), `sobre-mi` (alias `cv`, `resume`, `curriculum`, `about`, `2`) y `contacto` (alias `contact`); `menu` pasa a alias de `help`.

- [ ] **Step 1: Pruebas que fallan** (añadir a `src/lib/terminal/commands.test.ts`, reutilizando el `ctx` falso que ya define el fichero)

```ts
import { buildContentCommands } from './contentCommands';

describe('comandos de contenido', () => {
  const registry = new CommandRegistry();
  registry.registerAll(buildContentCommands());

  it('cv y about apuntan a sobre-mi', () => {
    expect(registry.resolveToken('cv')?.name).toBe('sobre-mi');
    expect(registry.resolveToken('about')?.name).toBe('sobre-mi');
  });

  it('proyectos imprime las 4 webs reales', () => {
    const printed: string[] = [];
    registry.resolveToken('proyectos')!.handler([], { ...ctx, print: h => printed.push(h) });
    expect(printed.join('')).toContain('viandalucia.org');
    expect(printed.join('')).toContain('alamia.es');
  });

  it('proyectos y sobre-mi están en el grupo destacado', () => {
    expect(registry.resolveToken('proyectos')?.group).toBe('featured');
    expect(registry.resolveToken('sobre-mi')?.group).toBe('featured');
  });
});
```

Run: `pnpm exec vitest run src/lib/terminal/commands` → FAIL.

- [ ] **Step 2: `registry.ts`** — añadir a `CommandSpec`:

```ts
  /** Grupo en la ayuda: 'featured' (Destacados) o 'lab' (Laboratorio, por defecto). */
  group?: 'featured' | 'lab';
```

- [ ] **Step 3: `src/lib/terminal/contentCommands.ts`**

```ts
import { profile } from '../../data/profile';
import { featuredProjects } from '../../data/projects';
import { services } from '../../data/services';
import type { CommandSpec } from './registry';
import { escapeHtml } from './sanitize';

export const buildContentCommands = (): CommandSpec[] => [
  {
    name: 'proyectos',
    aliases: ['projects', '3'],
    description: 'Webs en producción',
    group: 'featured',
    view: 'proyectos',
    handler: (_args, ctx) =>
      ctx.print(
        `<div class="section-title">Webs en producción</div><ul class="grid gap-2">${featuredProjects()
          .map(
            p =>
              `<li class="rounded-xl border border-terminal-dim p-3"><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="text-terminal-bright font-semibold">${escapeHtml(p.name)} ↗</a><div class="text-terminal-dim text-sm">${escapeHtml(p.summary)}</div></li>`
          )
          .join('')}</ul>`
      ),
  },
  {
    name: 'sobre-mi',
    aliases: ['cv', 'resume', 'curriculum', 'about', '2'],
    description: 'Quién soy y qué ofrezco',
    group: 'featured',
    view: 'sobre-mi',
    handler: (_args, ctx) =>
      ctx.print(
        `<div class="section-title">Hola, soy ${escapeHtml(profile.name)}</div>${profile.about
          .map(p => `<p class="mb-2">${escapeHtml(p)}</p>`)
          .join('')}<ol class="mt-3 grid gap-1">${services
          .map(
            (s, i) =>
              `<li><span class="text-terminal-bright">${String(i + 1).padStart(2, '0')}</span> ${escapeHtml(s.title)} — <span class="text-terminal-dim">${escapeHtml(s.description)}</span></li>`
          )
          .join('')}</ol>`
      ),
  },
  {
    name: 'contacto',
    aliases: ['contact'],
    description: 'Ir al formulario de contacto',
    group: 'featured',
    handler: () => {
      // Tras cerrar, la capa restaura el scroll anterior; el evento 'close' del
      // <dialog> llega después, así que el salto al formulario no se pisa.
      document
        .getElementById('terminal-sheet')
        ?.addEventListener('close', () => document.getElementById('contacto')?.scrollIntoView(), {
          once: true,
        });
      window.terminalSheet?.close();
    },
  },
];
```

- [ ] **Step 4: `commands.ts`**
  - Borrar las entradas `cv`, `projects` y `contact` de `buildCommands` y registrar `...buildContentCommands()` al principio del array.
  - `menu`: eliminar la entrada y añadir `'menu'`, `'m'` a los `aliases` de `help`.
  - `showHelp`: agrupar `visibleSpecs()` por `spec.group ?? 'lab'` y pintar dos bloques con títulos «Destacados» y «Laboratorio»; cambiar el texto final de atajos a «Atajos: 2=sobre mí, 3=proyectos, 1=noticias, 4=juegos, 5=calculadora, 6=apod, 8=chat.».
  - `ViewName`: sustituir `'cv' | 'projects' | 'contact' | 'menu'` por `'proyectos' | 'sobre-mi'`.
  - Eliminar la API legada, que solo usan sus propias pruebas: `CommandAction`, `SIMPLE_TYPES`, `buildDefaultRegistry`, `defaultRegistry`, `resolveCommand`, `ALL_COMMANDS` y `getCommandSuggestions` en `commands.ts`, y sus `describe` en `commands.test.ts` (comprobar antes con `grep -rln "resolveCommand\|getCommandSuggestions\|ALL_COMMANDS" src e2e` que solo aparecen ahí).

- [ ] **Step 5: Verificar**

Run: `pnpm test` → PASS. Run: `PW_CHANNEL=chrome pnpm test:e2e` y actualizar en `e2e/terminal.spec.ts`: la prueba del menú pasa a `help` y comprueba los textos «Destacados» y «Laboratorio»; `#cv` debe mostrar «Hola, soy Gusi».

- [ ] **Step 6: Commit**

```bash
git add src/lib/terminal/ e2e/terminal.spec.ts
git commit -m "feat(terminal): ayuda en Destacados/Laboratorio y comandos desde los datos del sitio"
```

### Task 10: Atajos contextuales, cabecera de la capa y teclado móvil

**Files:**

- Create: `src/lib/terminal/chips.ts`, `src/lib/terminal/chips.test.ts`
- Modify: `src/components/Terminal.astro` (fila `#quick-actions` generada), `src/lib/terminal/controller.ts`, `src/components/TerminalSheet.astro`
- Test: `e2e/site.spec.ts`

**Interfaces:**

- Consumes: `loadView` del controlador, `#sheet-path` (Task 5).
- Produces: `chipsFor(view: string): string[]`; evento `document` `'viewchange'` con `detail: { view: string }`.

- [ ] **Step 1: Prueba que falla** (`src/lib/terminal/chips.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { chipsFor } from './chips';

describe('chipsFor', () => {
  it('fuera de una vista ofrece lo principal', () => {
    expect(chipsFor('')).toEqual(['proyectos', 'sobre-mi', 'apod', 'news', 'chat', 'juegos']);
  });
  it('dentro de una vista quita la actual y añade clear', () => {
    expect(chipsFor('news')).toEqual(['proyectos', 'apod', 'chat', 'juegos', 'clear']);
  });
});
```

- [ ] **Step 2: `src/lib/terminal/chips.ts`**

```ts
const BASE = ['proyectos', 'sobre-mi', 'apod', 'news', 'chat', 'juegos'];
const IN_VIEW = ['proyectos', 'apod', 'news', 'chat', 'juegos'];

/** Atajos que se muestran encima del campo de entrada según la vista activa. */
export const chipsFor = (view: string): string[] =>
  view ? [...IN_VIEW.filter(c => c !== view), 'clear'] : BASE;
```

Run: `pnpm exec vitest run src/lib/terminal/chips` → PASS.

- [ ] **Step 3: Integración**
  - En `controller.ts`, al final de `loadView()`: `document.dispatchEvent(new CustomEvent('viewchange', { detail: { view } }));` y en `clear()`: la misma con `view: ''`.
  - En `Terminal.astro`, sustituir los 4 botones fijos de `#quick-actions` (F1–F4) por un contenedor vacío `<div id="quick-actions" class="flex gap-2 overflow-x-auto px-3 pb-1" role="toolbar" aria-label="Atajos"></div>` y un script que lo rellena con `chipsFor(view)` como `<button type="button" class="menu-item quick-chip rounded-full" data-cmd="…">…</button>` en la carga y en cada `viewchange`. El listener de `.quick-chip` del controlador pasa a delegación sobre `#quick-actions` (`closest('.quick-chip')`).
  - En `TerminalSheet.astro`, escuchar `viewchange` y poner `#sheet-path` a `~/${view}`.
  - Teclado móvil: en `sheet.ts`, dentro de `show()`, suscribirse a `window.visualViewport?.addEventListener('resize', fit)` con `const fit = () => { dialog.style.height = `${window.visualViewport!.height}px`; }` y quitarlo en `hide()`; en `hide()` restaurar `dialog.style.height = ''`.
  - Borrar los atajos de teclado F1–F4 del controlador (`handleKeyDown`).

- [ ] **Step 4: e2e** (añadir a `e2e/site.spec.ts`, proyecto móvil)

```ts
test('los atajos cambian con la vista', async ({ page }) => {
  await page.goto('/#news');
  const chips = page.locator('#quick-actions .quick-chip');
  await expect(chips.last()).toHaveText('clear');
  await expect(page.locator('#sheet-path')).toHaveText('~/news');
  await chips.filter({ hasText: 'proyectos' }).click();
  await expect(page.locator('#output-container')).toContainText('viandalucia.org');
});
```

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → verde.

- [ ] **Step 5: Commit**

```bash
git add src/lib/terminal/ src/components/Terminal.astro src/components/TerminalSheet.astro e2e/site.spec.ts
git commit -m "feat(terminal): atajos contextuales, ruta en la cabecera y ajuste al teclado móvil"
```

(La PR de la fase 3 se abre al terminar la Task 12.)

### Task 11: Un solo `escapeHtml`

**Files:**

- Modify: `src/components/APOD.astro`, `src/components/NewsFeed.astro`, `src/components/CosmicCalculator.astro`
- Test: `src/lib/terminal/sanitize.test.ts`

**Interfaces:**

- Consumes: `escapeHtml(text: string): string` de `src/lib/terminal/sanitize.ts` (escapa `& < > " '`).

- [ ] **Step 1: Prueba de regresión** (añadir a `sanitize.test.ts`)

```ts
it('escapa comillas para usarse dentro de atributos', () => {
  expect(escapeHtml(`"a" 'b' <c>`)).toBe('&quot;a&quot; &#39;b&#39; &lt;c&gt;');
});
```

Run: `pnpm exec vitest run src/lib/terminal/sanitize` → PASS (la función compartida ya lo hace; las copias privadas basadas en `div.textContent` NO escapaban comillas).

- [ ] **Step 2: Sustituir las copias**

En los tres componentes: borrar el método `private escapeHtml(text: string): string { … }`, añadir `import { escapeHtml } from '../lib/terminal/sanitize';` (APOD y NewsFeed ya importan `safeUrl` de ese módulo: ampliar ese import) y reemplazar `this.escapeHtml(` por `escapeHtml(`.

```bash
grep -rn "private escapeHtml\|this.escapeHtml" src
```

Expected: sin resultados.

- [ ] **Step 3: Verificar y commit**

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → verde.

```bash
git add src/components/APOD.astro src/components/NewsFeed.astro src/components/CosmicCalculator.astro src/lib/terminal/sanitize.test.ts
git commit -m "refactor: un solo escapeHtml (también escapa comillas) en APOD, noticias y calculadora"
```

### Task 12: Aligerar la calculadora cósmica

Objetivo: `CosmicCalculator.astro` pasa de ~1.180 líneas a ≤ 200, sin perder funciones (edades por planeta, edad en texto, zodiaco, APOD del día de nacimiento o alternativa, acontecimientos de Wikipedia traducidos, efemérides de respaldo, sistema solar animado, salir al menú).

**Files:**

- Modify: `src/lib/terminal/planetaryAge.ts`, `src/lib/terminal/planetaryAge.test.ts`
- Create: `src/lib/calculator/humanAge.ts`, `zodiac.ts`, `birthDay.ts`, `solarSystem.ts`, `render.ts`, `index.ts` (+ `humanAge.test.ts`, `zodiac.test.ts`, `birthDay.test.ts`)
- Create: `src/data/techEvents.ts`
- Modify: `src/components/CosmicCalculator.astro`
- Test: `e2e/terminal.spec.ts`

**Interfaces:**

- Produces:
  - `ORBITAL_PERIODS: Record<string, number>` y `planetaryAgesFromDays(days: number): { planet: string; age: number; orbitalPeriod: number }[]` (en `planetaryAge.ts`; `calculatePlanetaryAges` se reescribe sobre ella).
  - `formatHumanAge(birth: Date, today?: Date): string` y `formatDecimalAge(decimal: number): string`.
  - `zodiacSign(month0: number, day: number): string` (mes 0–11).
  - `techEventsFor(year: number): TechNewsEvent[]` y `interface TechNewsEvent` (en `src/data/techEvents.ts`).
  - `fetchOnThisDay(month: number, day: number): Promise<WikipediaEvent[]>` y `fetchBirthDayApod(birthdate: string): Promise<APODData | null>` (null si la fecha es anterior a 1995-06-16 o falla).
  - `startSolarSystem(canvas: HTMLCanvasElement, ages: { planet: string; age: number }[]): () => void` (devuelve la función que la detiene).
  - `renderResults(...)`, `renderNasa(...)`, `renderAlternative(...)`, `renderBirthYearNews(...)`: funciones puras que devuelven HTML usando `escapeHtml`/`safeUrl`.
  - `mountCalculator(root: ParentNode, terminal: TerminalController): void` (en `index.ts`).

- [ ] **Step 1: Pruebas de las funciones puras (fallan)**

`src/lib/calculator/humanAge.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatDecimalAge, formatHumanAge } from './humanAge';

describe('edad en texto', () => {
  it('años, meses y días', () => {
    expect(formatHumanAge(new Date(2000, 0, 15), new Date(2026, 8, 18))).toBe(
      '26 años, 8 meses, 3 días'
    );
  });
  it('singulares', () => {
    expect(formatHumanAge(new Date(2025, 7, 17), new Date(2026, 8, 18))).toBe(
      '1 año, 1 mes, 1 día'
    );
  });
  it('mismo día', () => {
    expect(formatHumanAge(new Date(2026, 8, 18), new Date(2026, 8, 18))).toBe('Menos de un día');
  });
  it('decimal', () => {
    expect(formatDecimalAge(2.5)).toBe('2 años, 6 meses');
  });
});
```

`src/lib/calculator/zodiac.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { zodiacSign } from './zodiac';

describe('zodiacSign', () => {
  it.each([
    [0, 1, '♑ Capricornio'],
    [0, 20, '♒ Acuario'],
    [4, 12, '♉ Tauro'],
    [11, 22, '♑ Capricornio'],
  ])('mes %i día %i → %s', (m, d, sign) => expect(zodiacSign(m, d)).toBe(sign));
});
```

Y en `planetaryAge.test.ts`:

```ts
it('planetaryAgesFromDays: un año terrestre = 1 en la Tierra', () => {
  const earth = planetaryAgesFromDays(365.26).find(a => a.planet === 'Tierra');
  expect(earth?.age).toBeCloseTo(1, 5);
});
```

Run: `pnpm exec vitest run src/lib/calculator src/lib/terminal/planetaryAge` → FAIL.

- [ ] **Step 2: Implementar las funciones puras**

`humanAge.ts`: mover el cuerpo de `calculateHumanAge` (hoy `CosmicCalculator.astro`, método en la línea ~251) como `formatHumanAge(birth, today = new Date())`, sustituyendo `new Date()` por `today`; y `calculateHumanAgeFromDecimal` como `formatDecimalAge`. Extraer el formateo común:

```ts
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const join = (y: number, m: number, d: number): string =>
  [
    y > 0 && plural(y, 'año', 'años'),
    m > 0 && plural(m, 'mes', 'meses'),
    d > 0 && plural(d, 'día', 'días'),
  ]
    .filter(Boolean)
    .join(', ') || 'Menos de un día';
```

`zodiac.ts`: mover `getZodiacSign` (línea ~556) tal cual como `zodiacSign`.

`planetaryAge.ts`: exportar `ORBITAL_PERIODS` y

```ts
export const planetaryAgesFromDays = (days: number) =>
  Object.entries(ORBITAL_PERIODS).map(([planet, orbitalPeriod]) => ({
    planet,
    orbitalPeriod,
    age: days / orbitalPeriod,
  }));

export const calculatePlanetaryAges = (birthdate: string) => {
  const days = (Date.now() - new Date(birthdate).getTime()) / 86_400_000;
  return planetaryAgesFromDays(days).map(({ planet, age }) => ({
    planet,
    age: Math.round(age * 100) / 100,
  }));
};
```

Run → PASS.

- [ ] **Step 3: Datos y red**

- `src/data/techEvents.ts`: mover `interface TechNewsEvent` y el contenido de `getFallbackTechEvents` (línea ~922) como `techEventsFor(year)`.
- `birthDay.ts`: mover la llamada a `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/{MM}/{DD}` (línea ~775) como `fetchOnThisDay(month, day)` (devuelve `[]` si falla) y la lógica de APOD del día de nacimiento de `fetchNASAData` como `fetchBirthDayApod(birthdate)` usando `fetchAPOD` de `../api/client`. Prueba en `birthDay.test.ts` con `vi.stubGlobal('fetch', …)`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchBirthDayApod, fetchOnThisDay } from './birthDay';

afterEach(() => vi.unstubAllGlobals());

describe('datos del día de nacimiento', () => {
  it('antes de 1995-06-16 no hay APOD', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchBirthDayApod('1990-05-12')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('Wikipedia caída → lista vacía', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 }))
    );
    expect(await fetchOnThisDay(5, 12)).toEqual([]);
  });
});
```

- `solarSystem.ts`: mover `initializeAlternativeSolarSystem` (línea ~484) como `startSolarSystem(canvas, ages)`, guardando el id de `requestAnimationFrame` y devolviendo `() => cancelAnimationFrame(id)`; si `prefers-reduced-motion`, dibuja un único fotograma.
- `render.ts`: mover los bloques de HTML de `displayResults`, la parte visual de `fetchNASAData`, `displayAlternativeAstronomyData` y `displayBirthYearNews` como funciones puras que reciben datos y devuelven `string`, usando `escapeHtml` y `safeUrl`.

Run: `pnpm exec vitest run src/lib/calculator` → PASS.

- [ ] **Step 4: Componente mínimo**

`src/lib/calculator/index.ts` → `mountCalculator(root, terminal)`: engancha `#calculator-submit`, `#calculator-exit` y Enter en `#birthdate` (dentro de `root`), valida la fecha (mensajes con `terminal.printOutput('<div class="error-text">…</div>')`), pinta `renderResults`, y en paralelo `fetchBirthDayApod` + `fetchOnThisDay` (traducidos con `translateBatch`) + `techEventsFor`. Sin `console.log`.

`CosmicCalculator.astro` queda con su plantilla HTML y:

```astro
<script>
  import { mountCalculator } from '../lib/calculator';
  document.addEventListener('loadView', e => {
    const { view } = (e as CustomEvent).detail;
    if (view !== 'calculator' || !window.terminal) return;
    const tpl = document.getElementById('calculator-component');
    if (!tpl) return;
    window.terminal.printOutput(tpl.innerHTML);
    const blocks = document.querySelectorAll('#output-container .terminal-output');
    const root = blocks[blocks.length - 1];
    if (root) mountCalculator(root, window.terminal);
  });
</script>
```

- [ ] **Step 5: Verificar**

```bash
wc -l src/components/CosmicCalculator.astro   # ≤ 200
grep -rn "console.log" src | grep -v test      # sin resultados
```

Añadir a `e2e/terminal.spec.ts`:

```ts
test('la calculadora muestra zodiaco y edades por planeta', async ({ terminal }) => {
  await terminal.run('calculadora');
  await terminal.last.locator('#birthdate').fill('1990-05-12');
  await terminal.last.locator('#calculator-submit').click();
  await expect(terminal.last).toContainText('Tauro');
  await expect(terminal.last).toContainText('Marte');
});
```

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → verde (incluidas las pruebas de calculadora existentes).

- [ ] **Step 6: Commit**

```bash
git add src/lib/calculator/ src/lib/terminal/planetaryAge.ts src/lib/terminal/planetaryAge.test.ts src/data/techEvents.ts src/components/CosmicCalculator.astro e2e/terminal.spec.ts
git commit -m "refactor(calculadora): de 1.180 a ≤200 líneas en módulos probados, sin perder funciones"
git push -u origin feat/rediseno-terminal
gh pr create --base develop --title "feat(rediseño): fase 3 · terminal nueva, calculadora ligera"
```

---

# FASE 4 · Limpieza, rendimiento y release

Rama: `git switch -c chore/rediseno-limpieza develop`

### Task 13: Eliminar lo antiguo y service worker v5

**Files:**

- Delete: `src/components/CV.astro`, `src/components/Projects.astro`, `src/components/Menu.astro`, `src/lib/cv/printCV.ts`
- Modify: `src/components/Terminal.astro` (fuera cabecera ASCII, logo móvil, reloj, `.scanline`, `crt-flicker`), `src/lib/terminal/controller.ts` (fuera `startHeaderClock`), `src/lib/effects/matrixBackground.ts` y `src/lib/terminal/configMenu.ts` (efecto retro opcional dentro de la capa, apagado por defecto), `src/pages/index.astro`, `public/sw.js`, `public/sitemap.xml`
- Test: suite completa

- [ ] **Step 1: Borrar y limpiar referencias**

```bash
git rm src/components/CV.astro src/components/Projects.astro src/components/Menu.astro src/lib/cv/printCV.ts
grep -rnE "printCV|loadMenu|startHeaderClock|ascii-header|menu-container|terminal-datetime" src
```

Expected: el `grep` solo muestra usos a eliminar; quitarlos hasta que no devuelva nada. En `commands.ts`, `cv --pdf` deja de existir (la opción desaparece con el CV ficticio).

- [ ] **Step 1b: Lluvia Matrix como efecto opcional dentro de la capa (spec §3)**

En `src/lib/effects/matrixBackground.ts`:

- `initMatrixBackground(container: HTMLElement = document.body)`: guardar `container` y en `start()` usar `container.prepend(canvas)` en lugar de `document.body.prepend(canvas)`; al canvas, `canvas.className = 'pointer-events-none absolute inset-0 -z-10 opacity-20'`.
- `effectsDisabled()` pasa a `localStorage.getItem('nexus-effects') !== 'on'` (apagado por defecto; se deja de leer `nexus-reduced-effects` y la clase `reduced-effects`).

En `Terminal.astro`, llamar a `initMatrixBackground(document.getElementById('terminal-sheet')!)` y añadir `position: relative; isolation: isolate;` a `.terminal-sheet__body`.

En `configMenu.ts`, caso `'effects'`: el botón alterna `localStorage['nexus-effects']` entre `'on'` y `'off'`, emite `effectschange` y responde «Efecto retro activado/desactivado». Texto del botón: «Activar efecto retro (lluvia Matrix)» / «Desactivar efecto retro».

Prueba (añadir a `e2e/terminal.spec.ts`):

```ts
test('el efecto retro está apagado por defecto', async ({ terminal, page }) => {
  await terminal.run('help');
  await expect(page.locator('#terminal-sheet canvas')).toHaveCount(0);
});
```

- [ ] **Step 2: Service worker**

En `public/sw.js`: `const CACHE_NAME = 'nexus-terminal-v5';`. Comprobar que la estrategia sigue igual (navegación red-primero, `/_astro/*` caché-primero, `/api/*` sin caché).

- [ ] **Step 3: Sitemap** (`public/sitemap.xml`): una sola URL `https://gusi.dev/` con `<lastmod>` del día de la release.

- [ ] **Step 4: Verificar**

Run: `pnpm lint:check && pnpm format:check && pnpm test && pnpm build && PW_CHANNEL=chrome pnpm test:e2e` → todo en verde.

- [ ] **Step 5: Commit**

```bash
git add -u src public e2e
git commit -m "chore(rediseño): fuera CV/proyectos ficticios, menú, efectos CRT y ASCII; SW v5"
```

(`git add -u` solo añade cambios y borrados de ficheros ya versionados; no incluye nada nuevo accidental.)

### Task 14: La terminal se descarga solo al abrirla

Objetivo: quien solo visita la página descarga ≤ 5 KB de JS (gzip) en lugar de ~27 KB, y el HTML deja de incluir las plantillas ocultas de las vistas.

**Files:**

- Create: `src/lib/views/news.ts`, `apod.ts`, `chat.ts`, `games.ts` (el `<script>` de cada componente, movido)
- Modify: `src/components/NewsFeed.astro`, `APOD.astro`, `Chat.astro`, `Games.astro`, `CosmicCalculator.astro` (solo plantilla, sin `<script>`)
- Create: `src/pages/terminal-vistas.astro` (plantillas de las vistas en una página aparte)
- Create: `src/lib/terminal/viewTokens.ts`, `src/lib/terminal/viewTokens.test.ts`
- Create: `src/lib/terminal/lazy.ts`
- Modify: `src/components/TerminalSheet.astro`, `src/components/Terminal.astro`, `src/pages/index.astro`, `public/robots.txt`
- Test: `e2e/site.spec.ts`

**Interfaces:**

- Consumes: `classifyHash` (Task 5), `createTerminalSheet` (Task 5), `mountCalculator` (Task 12).
- Produces:
  - `VIEW_TOKENS: readonly string[]` — tokens que abren la terminal por hash, sin cargar el registro.
  - `ensureTerminal(): Promise<TerminalSheet>` — carga una sola vez plantillas + controlador + vistas y devuelve la capa.
  - Cada `src/lib/views/<vista>.ts` exporta `install(): void` (idempotente) con el listener `loadView` que hoy vive en el componente.

- [ ] **Step 1: Prueba que falla** (`src/lib/terminal/viewTokens.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { buildCommands } from './commands';
import { CommandRegistry } from './registry';
import { VIEW_TOKENS } from './viewTokens';

describe('VIEW_TOKENS', () => {
  it('coincide con los tokens navegables del registro', () => {
    const registry = new CommandRegistry();
    registry.registerAll(
      buildCommands({ history: { list: () => [], clear: () => undefined } as never })
    );
    const navigable = registry
      .specs()
      .filter(s => s.view)
      .flatMap(s => [s.name, ...(s.aliases ?? [])])
      .filter(t => /^[\p{L}-]+$/u.test(t))
      .map(t => t.toLowerCase())
      .sort();
    expect([...VIEW_TOKENS].sort()).toEqual(navigable);
  });
});
```

Run: `pnpm exec vitest run src/lib/terminal/viewTokens` → FAIL.

- [ ] **Step 2: `viewTokens.ts`**

Crear el fichero con la lista literal que imprime la prueba al fallar (copiar el array `Expected`), con el comentario `// Mantener sincronizado con commands.ts (lo vigila viewTokens.test.ts).`. Run → PASS.

- [ ] **Step 3: Mover los scripts de las vistas**

Para `NewsFeed`, `APOD`, `Chat` y `Games`: mover todo el contenido de su `<script>` a `src/lib/views/<vista>.ts`, envolviendo los `document.addEventListener(...)` de nivel superior en

```ts
let installed = false;
export const install = (): void => {
  if (installed) return;
  installed = true;
  // …listeners movidos sin cambios…
};
```

Las clases y funciones auxiliares quedan a nivel de módulo. Los imports relativos pasan de `'../lib/…'` a `'../…'`. El componente conserva solo su plantilla HTML. Para la calculadora, crear `src/lib/views/calculator.ts` con el listener del Step 4 de la Task 12 dentro de `install()`.

- [ ] **Step 4: Plantillas fuera de la página principal**

`src/pages/terminal-vistas.astro`:

```astro
---
// Plantillas de las vistas de la terminal. La capa las descarga al abrirse por
// primera vez (lazy.ts); no es una página para visitantes (robots: Disallow).
import APOD from '../components/APOD.astro';
import Chat from '../components/Chat.astro';
import CosmicCalculator from '../components/CosmicCalculator.astro';
import Games from '../components/Games.astro';
import NewsFeed from '../components/NewsFeed.astro';
---

<div id="terminal-vistas">
  <NewsFeed />
  <APOD />
  <Chat />
  <Games />
  <CosmicCalculator />
</div>
```

Quitar esos cinco componentes de `index.astro`. En `public/robots.txt` añadir `Disallow: /terminal-vistas/`.

- [ ] **Step 5: `src/lib/terminal/lazy.ts`**

```ts
import type { TerminalSheet } from './sheet';

let loading: Promise<TerminalSheet> | null = null;

/** Descarga (una vez) plantillas, controlador y vistas, y devuelve la capa lista. */
export const ensureTerminal = (): Promise<TerminalSheet> =>
  (loading ??= (async () => {
    const [html, { TerminalController }, { createTerminalSheet }, ...views] = await Promise.all([
      fetch('/terminal-vistas/').then(r => r.text()),
      import('./controller'),
      import('./sheet'),
      import('../views/news'),
      import('../views/apod'),
      import('../views/chat'),
      import('../views/games'),
      import('../views/calculator'),
    ]);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const holder = document.getElementById('terminal-view-templates');
    const vistas = doc.getElementById('terminal-vistas');
    if (holder && vistas) holder.replaceChildren(...vistas.children);
    views.forEach(v => v.install());

    window.terminal = new TerminalController();
    const dialog = document.getElementById('terminal-sheet') as HTMLDialogElement;
    const input = document.getElementById('terminal-input') as HTMLInputElement;
    const sheet = createTerminalSheet(
      dialog,
      cmd => window.terminal?.run?.(cmd),
      () => input.focus()
    );
    window.terminalSheet = sheet;
    return sheet;
  })());
```

En `TerminalSheet.astro` añadir `<div id="terminal-view-templates" hidden></div>` dentro del `<dialog>`. En `Terminal.astro`, quitar del `<script>` la creación del controlador y de la capa (ahora la hace `ensureTerminal`); dejar solo el cierre por `[data-close-terminal]`.

- [ ] **Step 6: Arranque ligero en la página** (`index.astro`)

```astro
<script>
  import { classifyHash } from '../lib/terminal/hashRoute';
  import { VIEW_TOKENS } from '../lib/terminal/viewTokens';

  const isView = (t: string) => VIEW_TOKENS.includes(t);
  const openFromHash = async () => {
    const target = classifyHash(location.hash, isView);
    if (target.kind !== 'terminal' && target.kind !== 'view') return;
    const { ensureTerminal } = await import('../lib/terminal/lazy');
    (await ensureTerminal()).show();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  document.addEventListener('click', async e => {
    const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-open-terminal]');
    if (!trigger || window.terminalSheet) return; // una vez cargada, sheet.ts gestiona los clics
    e.preventDefault();
    const { ensureTerminal } = await import('../lib/terminal/lazy');
    (await ensureTerminal()).open(trigger.dataset.command);
  });
  void openFromHash();
</script>
```

- [ ] **Step 7: e2e de peso y funcionamiento** (añadir a `e2e/site.spec.ts`)

```ts
test('la página no descarga la terminal hasta abrirla', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const jsBytes = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter(r => r.name.endsWith('.js'))
      .reduce((n, r) => n + (r as PerformanceResourceTiming).encodedBodySize, 0)
  );
  expect(jsBytes).toBeLessThan(8_000);
  expect(await page.content()).not.toContain('calculator-component');

  await page.locator('[data-open-terminal]').first().click();
  await expect(page.locator('#terminal-input')).toBeVisible();
});
```

(`encodedBodySize` es 0 con el servidor de `astro preview` si no comprime; en ese caso la prueba compara tamaño sin comprimir: umbral 20 000. Ajustar la constante a lo que dé el build tras comprobar que la terminal no aparece en la lista de recursos: `expect(names.some(n => n.includes('controller'))).toBe(false)`.)

Run: `pnpm test && PW_CHANNEL=chrome pnpm test:e2e` → verde (todas las pruebas de la terminal siguen pasando porque `Terminal.open()` hace clic en `[data-open-terminal]`).

- [ ] **Step 8: Commit**

```bash
git add src/lib/views/ src/lib/terminal/lazy.ts src/lib/terminal/viewTokens.ts src/lib/terminal/viewTokens.test.ts src/pages/ src/components/ public/robots.txt e2e/site.spec.ts
git commit -m "perf(terminal): la terminal y sus vistas se descargan solo al abrirla"
```

### Task 15: Auditoría de rendimiento y accesibilidad en móvil

**Files:**

- Modify: los que indique la auditoría.
- Create: `docs/superpowers/specs/2026-09-18-rediseno-lighthouse.md` (resultados)

- [ ] **Step 1: Desplegar en staging** (merge de la PR de limpieza en `develop`) y esperar al workflow `deploy-worker.yml` en verde.

- [ ] **Step 2: Medir**

```bash
npx lighthouse https://dev.gusi.dev/ --form-factor=mobile --screenEmulation.mobile --output=json --output-path=./lh.json --chrome-flags="--headless"
node -e "const r=require('./lh.json').categories;for(const k in r)console.log(k, Math.round(r[k].score*100))"
```

Expected: `performance`, `accessibility`, `best-practices`, `seo` ≥ 90. (Staging devuelve `X-Robots-Tag: noindex`, que penaliza SEO: para esa categoría, medir `https://gusi.dev` tras la release o ignorar solo la auditoría `is-crawlable`.)

- [ ] **Step 3: Corregir** cada auditoría fallida (típicas: tamaño de imágenes → ajustar `widths`/`sizes`; contraste → subir `muted` a `#7d8896` si no llega a 4.5:1; JS inicial > 5 KB gzip → revisar qué módulo entra en el bundle de la página (`pnpm build` y mirar `dist/_astro/`)). Repetir el Step 2 hasta cumplir.

- [ ] **Step 4: Guardar resultados y commit**

```bash
git add docs/superpowers/specs/2026-09-18-rediseno-lighthouse.md <ficheros corregidos>
git commit -m "perf(rediseño): ajustes tras Lighthouse móvil (≥90 en las cuatro categorías)"
```

### Task 16: Release a producción

- [ ] **Step 1:** Confirmar con el usuario que ha validado en `https://dev.gusi.dev` los textos de `src/data/*` y el comportamiento en su móvil.
- [ ] **Step 2:** `gh pr create --base main --head develop --title "release: rediseño de gusi.dev"`; esperar `verify` en verde.
- [ ] **Step 3:** Con autorización explícita del usuario: `gh pr merge <n> --merge`.
- [ ] **Step 4:** Esperar `deploy-worker.yml` en `main` (incluye e2e contra `https://gusi.dev`) y comprobar a mano: `curl -sI https://gusi.dev/ | grep -i cache-control` → `no-cache`; la página muestra «Webs rápidas y a medida»; `https://gusi.dev/#apod` abre la terminal.

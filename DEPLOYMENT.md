# Despliegue — Blade Runner Terminal

## Flujo de trabajo (ramas y entornos)

```
feat/xxx ──PR──▶ develop ──(deploy automático)──▶ staging     https://dev.gusi.dev
                    │
                    └──PR «release»──▶ main ──(deploy automático)──▶ producción  https://gusi.dev
```

1. Crea la rama de la mejora desde `develop` (`git switch -c feat/xxx develop`).
2. PR hacia `develop`. Requiere el check `verify` (lint, tests, build y e2e con API simulada).
3. Al mergear, `.github/workflows/deploy-worker.yml` despliega **staging** y pasa las pruebas e2e contra `https://dev.gusi.dev`. Pruébalo ahí.
4. Cuando todo funciona, PR `develop → main` y mergea con **merge commit** (no squash, para que las ramas no diverjan). Se despliega **producción** y se vuelven a pasar las e2e contra `https://gusi.dev`.

`main` y `develop` están protegidas (sin borrado, solo por PR, con `verify` obligatorio). Dependabot abre sus PR contra `develop`.

## Web + API (un solo Cloudflare Worker)

El Worker `blade-runner-api` sirve la web (`dist/` de Astro, como _static assets_) **y** la API (`/api/*`), en las rutas `gusi.dev/*` y `www.gusi.dev/*` (www redirige a `gusi.dev`). Staging es el Worker `blade-runner-staging` en el dominio `dev.gusi.dev` (`--env staging`).

- Cabeceras de caché y seguridad: `serveStatic` en `workers/src/index.ts` (`/_astro/*` inmutable; HTML y `sw.js` sin caché).
- `PUBLIC_API_BASE_URL` se fija en el workflow según el entorno (la API vive en el mismo dominio). Las variables `PUBLIC_*` se incrustan en el JS público: nunca pongas claves ahí.
- **Vuelta atrás rápida:** quitar las rutas `gusi.dev/*` y `www.gusi.dev/*` del Worker (panel de Cloudflare → Workers → blade-runner-api → Settings → Domains & Routes). El tráfico vuelve al origen de GitHub Pages mientras siga activo.

### GitHub Pages (en retirada)

`.github/workflows/deploy.yml` sigue publicando en GitHub Pages durante la transición, solo como vuelta atrás. Se eliminará cuando el Worker lleve unos días sirviendo la web sin incidencias.

## Cloudflare Worker (API + Chat IA)

### Cuenta de Cloudflare

El Worker vive en la cuenta **Gusi** (`1f7c0d40473dbca21d83ed0495b171db`), fijada en `workers/wrangler.jsonc`. Si `wrangler` da `Authentication error [code: 10000]`, comprueba con `pnpm exec wrangler whoami` que tu sesión tiene acceso a esa cuenta.

### Setup inicial

```bash
pnpm install
pnpm exec wrangler login
pnpm exec wrangler kv namespace create CACHE
```

Copia el ID del namespace en `workers/wrangler.jsonc` → `kv_namespaces[0].id`

### Secrets

```bash
pnpm exec wrangler secret put NASA_API_KEY
pnpm exec wrangler secret put GUARDIAN_API_KEY
```

### Desarrollo local

```bash
pnpm --filter blade-runner-api dev
```

### Despliegue manual

```bash
pnpm build                                            # compila la web en dist/
pnpm --filter blade-runner-api run release            # producción
pnpm --filter blade-runner-api run release:staging    # staging
```

Lo normal es el despliegue automático (`.github/workflows/deploy-worker.yml`), que usa los secrets `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.

## Variables de entorno locales

```bash
cp .env.example .env
```

| Variable                  | Descripción                                      |
| ------------------------- | ------------------------------------------------ |
| `PUBLIC_API_BASE_URL`     | URL base del Worker                              |
| `PUBLIC_NASA_API_KEY`     | Solo dev local sin Worker (se expone al público) |
| `PUBLIC_GUARDIAN_API_KEY` | Solo dev local sin Worker (se expone al público) |

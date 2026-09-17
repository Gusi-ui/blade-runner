# Despliegue — Blade Runner Terminal v2

## Frontend (GitHub Pages + Cloudflare DNS)

1. Push a `main` → GitHub Actions construye y despliega `./dist`
2. Configura en GitHub (Settings → Secrets and variables → Actions → **Variables**):
   - `PUBLIC_API_BASE_URL` (URL del Worker, ej. `https://blade-runner-api.tu-cuenta.workers.dev`)

   > ⚠️ No añadas `PUBLIC_NASA_API_KEY` ni `PUBLIC_GUARDIAN_API_KEY` al build: las variables `PUBLIC_*` se incrustan en el JavaScript público. Las claves viven solo como secrets del Worker.

3. `main` está protegida: todo cambio entra por Pull Request y requiere que pase el check `verify` (`.github/workflows/ci.yml`).

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

### Despliegue

```bash
pnpm --filter blade-runner-api run release
```

O automático vía `.github/workflows/deploy-worker.yml` con secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Rutas en producción

Configura en Cloudflare DNS un route o custom domain para el Worker:

- `gusi.dev/api/*` → Worker `blade-runner-api`

Luego en el build del frontend:

```env
PUBLIC_API_BASE_URL=https://gusi.dev
```

## Variables de entorno locales

```bash
cp .env.example .env
```

| Variable                  | Descripción                                      |
| ------------------------- | ------------------------------------------------ |
| `PUBLIC_API_BASE_URL`     | URL base del Worker                              |
| `PUBLIC_NASA_API_KEY`     | Solo dev local sin Worker (se expone al público) |
| `PUBLIC_GUARDIAN_API_KEY` | Solo dev local sin Worker (se expone al público) |

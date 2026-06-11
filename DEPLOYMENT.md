# Despliegue — Blade Runner Terminal v2

## Frontend (GitHub Pages + Cloudflare DNS)

1. Push a `main` → GitHub Actions construye y despliega `./dist`
2. Configura secrets en GitHub:
   - `PUBLIC_NASA_API_KEY`
   - `PUBLIC_GUARDIAN_API_KEY` (opcional)
   - `PUBLIC_API_BASE_URL` (URL del Worker, ej. `https://blade-runner-api.tu-cuenta.workers.dev`)

## Cloudflare Worker (API + Chat IA)

### Setup inicial

```bash
pnpm install
pnpm exec wrangler login
pnpm exec wrangler kv:namespace create CACHE
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

| Variable                  | Descripción                       |
| ------------------------- | --------------------------------- |
| `PUBLIC_NASA_API_KEY`     | Clave NASA (fallback cliente)     |
| `PUBLIC_GUARDIAN_API_KEY` | Clave Guardian (fallback cliente) |
| `PUBLIC_API_BASE_URL`     | URL base del Worker               |

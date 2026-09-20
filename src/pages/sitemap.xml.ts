import { execSync } from 'node:child_process';
import type { APIRoute } from 'astro';

// Sitemap generado en el build (antes era un XML fijo en public/, sin lastmod).
// Solo se publica la portada: /terminal-vistas/ son plantillas internas y están
// excluidas en robots.txt.

/**
 * Fecha del último commit que tocó el contenido de la web. Se prefiere a la
 * fecha del build: así `lastmod` no cambia en cada despliegue si la web no ha
 * cambiado, que es justo lo que hace que los buscadores dejen de fiarse de él.
 */
const lastContentChange = (): string => {
  try {
    const iso = execSync('git log -1 --format=%cI -- src public astro.config.mjs', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (iso) return iso.slice(0, 10);
  } catch {
    // Sin git (o sin historia): se usa la fecha del build.
  }
  return new Date().toISOString().slice(0, 10);
};

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://gusi.dev')).href;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}</loc>
    <lastmod>${lastContentChange()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

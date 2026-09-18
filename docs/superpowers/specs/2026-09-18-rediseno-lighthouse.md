# Rediseño de gusi.dev — auditoría Lighthouse

Lighthouse 12 sobre la build de producción (`astro preview`, API real), 2026-09-18.

| Perfil     | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP   | CLS   |
| ---------- | ----------- | ------------- | ---------------- | --- | ----- | ----- |
| Móvil      | 98          | 100           | 100              | 100 | 2,1 s | 0,008 |
| Escritorio | 100         | 100           | 100              | 100 | 0,5 s | 0,011 |

Correcciones aplicadas tras la primera pasada (móvil: 99 · 96 · 100 · 100):

- `--color-muted` de `#6b7684` a `#7d8896`: el contraste pasa de 3,97–4,22 a ≥ 5,09 sobre `bg`, `surface` y `surface-2` (WCAG AA).
- Terminal viva: se quita `aria-label` (no coincidía con el texto visible del botón).

Peso de la página (gzip): JavaScript ~4,6 KB (antes ~27 KB) y HTML ~5 KB (antes ~11 KB). La terminal, sus vistas y sus plantillas se descargan solo al abrirla.

Pendiente: repetir en staging (`https://dev.gusi.dev`) tras el despliegue; SEO allí baja por `X-Robots-Tag: noindex`, que es intencionado.

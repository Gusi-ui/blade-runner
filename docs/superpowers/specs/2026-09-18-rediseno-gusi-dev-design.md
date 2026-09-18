# Rediseño de gusi.dev — especificación

- **Fecha:** 2026-09-18
- **Estado:** aprobada en brainstorming, pendiente de plan de implementación
- **Maquetas de referencia:** `.superpowers/brainstorm/` (local, no versionado): `direccion-visual.html` (B), `movil-estructura.html` (C), `pagina-movil.html`, `terminal-completa.html`

## 1. Objetivo

Renovar el aspecto de gusi.dev para que **capte clientes**, pensando **primero en el móvil**, sin perder la identidad de terminal interactiva ni sus funciones actuales.

Criterios de éxito:

1. Un visitante entiende en menos de 5 s qué ofrece Gusi y cómo contactarle, sin tocar la terminal.
2. En móvil, Lighthouse ≥ 90 en rendimiento, accesibilidad, buenas prácticas y SEO.
3. El contenido profesional está en el HTML (indexable), no generado por JavaScript.
4. Todos los comandos actuales siguen funcionando dentro de la terminal.

## 2. Decisiones tomadas

| Tema                                                         | Decisión                                                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Concepto                                                     | Terminal renovada (no portfolio clásico ni cambio total).                                                                  |
| Objetivo                                                     | Captar clientes / empleo.                                                                                                  |
| Dirección visual                                             | **B · Terminal moderna**: fondo gris muy oscuro, verde como único acento, terminal como ventana.                           |
| Estructura móvil                                             | **C · Página con terminal viva**: una página vertical; arriba una terminal que escribe sola y al tocarla se usa de verdad. |
| Extras (noticias, APOD, juegos, calculadora, chat IA, temas) | **Solo desde la terminal** (sección «Laboratorio» del `help`). No aparecen en la página.                                   |
| Proyectos destacados                                         | viandalucia.org, divermataro.org, irenepuigdemont.com, alamia.es (reales, en producción).                                  |
| CV                                                           | Se sustituye por **«Sobre mí» + servicios**. El CV y los proyectos ficticios actuales se eliminan.                         |
| Enfoque técnico                                              | **Página estática nueva + terminal a pantalla completa** que reutiliza el controlador actual.                              |

## 3. Sistema visual

- **Colores** (tokens únicos vía `@theme` de Tailwind 4):
  - `--color-bg` `#0b0d10` · `--color-surface` `#0f1317` · `--color-surface-2` `#11151a`
  - `--color-border` `#1f262e` / `#2b333d`
  - `--color-text` `#c9d1db` · `--color-text-strong` `#f5f7fa` · `--color-muted` `#6b7684`
  - `--color-accent` `#4ade80` · `--color-accent-ink` `#04140a` (texto sobre acento)
- **Tipografía:** Space Grotesk (textos y titulares) y JetBrains Mono (terminal, etiquetas técnicas `// sección`, tags). Autoalojadas (paquetes `@fontsource-variable/*`), con `font-display: swap` y precarga del peso principal.
- **Radios:** 10–12 px en tarjetas y botones; botones principales en verde sólido, secundarios con borde.
- **Contraste:** todos los textos cumplen WCAG AA sobre `--color-bg`/`--color-surface`.
- **Efectos:** sin lluvia Matrix ni parpadeo CRT en la página. Dentro de la terminal quedan como opción de `config` (desactivados por defecto) y los temas de color (`theme amber|cyberpunk|phosphor|classic`) se conservan, reasignando los tokens.
- **Movimiento:** con `prefers-reduced-motion: reduce` no hay animación de escritura ni transiciones de apertura.

## 4. Página (móvil primero)

Orden de secciones (maqueta `pagina-movil.html`):

1. **`SiteHeader`**: fijo arriba. Marca `gusi.dev` y botón «Contactar» (ancla a `#contacto`). En escritorio añade enlaces a Proyectos / Sobre mí.
2. **`Hero`**:
   - Etiqueta `// desarrollador full stack`.
   - Titular de valor (borrador: «Webs rápidas y a medida para tu negocio.»), subtítulo con stack y servicio de migración desde WordPress.
   - Botones «Hablemos» (→ `#contacto`) y «Ver proyectos» (→ `#proyectos`).
   - **`LiveTerminal`**: ventana con barra y 3 comandos que se escriben solos (`whoami`, `stack`, `proyectos --count`). Pie «▶ Toca para usar la terminal». Toda la ventana es un `<button>` accesible que abre la terminal completa.
   - Escritorio (≥ 1024 px): dos columnas, texto a la izquierda y terminal a la derecha.
3. **`ProjectsSection`** (`#proyectos`): tarjeta por proyecto con captura, nombre, frase de valor para el cliente, tags de tecnología y enlace a la web. Móvil: 1 columna; tablet: 2; escritorio: 2×2.
4. **`AboutSection`** (`#sobre-mi`): «Hola, soy Gusi» + 3–4 frases reales + lista numerada de servicios (01 Webs a medida · 02 Migración desde WordPress · 03 Mantenimiento y hosting) + stack.
5. **`ContactSection`** (`#contacto`): el formulario actual (`/api/contact`, campo trampa `website`, límites del Worker) con el estilo nuevo, más email y GitHub.
6. **`SiteFooter`**: © año, enlaces y guiño «escribe `help` en la terminal».

Contenido pendiente del usuario (se preparará un borrador para que lo corrija): texto de «Sobre mí», frase de valor de cada proyecto y lista definitiva de servicios.

## 5. Terminal a pantalla completa

Maqueta `terminal-completa.html`.

- **Contenedor `TerminalSheet`**: capa `position: fixed` a pantalla completa en móvil; en escritorio, ventana centrada (máx. ~960×80vh) sobre un fondo oscurecido. Usa `<dialog>` con `showModal()` para foco atrapado y `Esc`.
- **Cabecera:** botón ✕, ruta de la vista (`nexus-7 ~/news`) e indicador `● online` (resultado de `/api/health`).
- **Salida:** el `#output-container` actual. Las vistas se renderizan como tarjetas con el sistema visual nuevo.
- **Atajos:** fila de chips desplazable encima del campo de entrada. Contenido contextual: en general `proyectos · apod · news · chat · juegos`; dentro de una vista, las acciones relevantes (p. ej. `clear`).
- **Entrada:** campo fijo abajo, sobre el teclado del móvil (se ajusta con `visualViewport`), con botón de enviar.
- **Abrir / cerrar:**
  - Se abre al tocar `LiveTerminal` o al entrar con un enlace de vista (ver más abajo).
  - Abrir hace `history.pushState` con el hash de la vista (`#terminal` o `#news`, `#apod`…); **atrás**, ✕ o `Esc` cierran y restauran el scroll de la página.
  - Entrar con un hash de vista válido (`/#apod`, `/#news`, `/#juegos`…) abre la terminal directamente en esa vista. Los hashes de sección de la página (`#proyectos`, `#sobre-mi`, `#contacto`) **no** abren la terminal.
- **Ayuda (`help`)** dividida en **Destacados** (`proyectos`, `sobre-mi`, `contacto`) y **Laboratorio** (`news`, `apod`, `chat`, `ask`, `juegos`, `guess`, `edad`, `calculadora`, `theme`, `config`…).
- **Comandos de contenido:** `proyectos` y `sobre-mi` renderizan desde los mismos datos que la página (§6). `cv` pasa a ser alias de `sobre-mi`; `contacto` cierra la terminal y lleva a `#contacto`.
- **Juegos:** siguen ocupando la pantalla completa con sus controles táctiles actuales.
- Se reutilizan sin cambios de lógica: `TerminalController`, `CommandRegistry`, historial, autocompletado, parser, intérpretes interactivos y los módulos de noticias, APOD, chat, calculadora y juegos (solo cambian sus plantillas y estilos).

## 6. Datos

- `src/data/projects.ts`: `{ slug, name, url, summary, tags[], image, featured }[]`.
- `src/data/services.ts`: `{ title, description }[]`.
- `src/data/profile.ts`: nombre, rol, frase de presentación, texto «Sobre mí», email, GitHub.
- Una sola fuente para la página (componentes Astro, en build) y la terminal (comandos, en cliente).

## 7. Capturas de proyectos

- Script `scripts/capture-projects.mjs` (Playwright) que captura cada web a 1280×800 y la guarda como WebP optimizado en `public/images/projects/<slug>.webp` (+ variante 640 px). Se ejecuta a mano y las imágenes se versionan.
- `<img>` con `width`/`height`, `loading="lazy"` y `srcset`.

## 8. SEO y rendimiento

- `<title>`, meta description, Open Graph y Twitter Card orientados a servicios.
- JSON-LD `Person` + `ProfessionalService` con los servicios.
- `sitemap.xml` y `robots.txt` actualizados; staging mantiene `noindex` (ya lo hace el Worker).
- Presupuesto en móvil: LCP < 2,5 s, CLS < 0,1, JS inicial de la página ≤ 5 KB gzip (hoy ~27 KB). La terminal, sus vistas y sus plantillas se descargan **solo al abrirla** (`import()` + `/terminal-vistas/`).
- Service worker: subir `CACHE_NAME` a `nexus-terminal-v5` para descartar recursos antiguos.

## 9. Código que se elimina o sustituye

- `src/components/CV.astro` y `src/components/Projects.astro` (contenido ficticio), `Menu.astro` (el menú lo sustituyen la ayuda y los chips; el comando `menu` pasa a ser alias de `help` y los atajos numéricos `1`–`8` se mantienen).
- `src/styles/terminal.css` (≈1.100 líneas) → `src/styles/site.css` (tokens y base) + `src/styles/terminal.css` nuevo y reducido.
- `tailwind.config.mjs` y `@config` → `@theme` en CSS.
- Cabecera ASCII, `matrixBackground` en la página y efectos CRT por defecto.
- Accesos rápidos F1–F4 (sustituidos por los chips).
- **Aligerado de componentes pesados:** `CosmicCalculator.astro` (≈1.180 líneas) se divide en módulos probados en `src/lib/calculator/` y queda ≤ 200 líneas, sin perder funciones; las copias privadas de `escapeHtml` (APOD, noticias, calculadora) se sustituyen por la de `sanitize.ts`; fuera los `console.log`.

## 10. Pruebas

- **e2e (Playwright, móvil y escritorio), nuevas:**
  - Las secciones se ven y el contenido está en el HTML servido (sin JS).
  - «Contactar» / «Hablemos» llevan a `#contacto`; «Ver proyectos» a `#proyectos`.
  - Tocar la terminal viva abre la terminal; ✕, `Esc` y **atrás** la cierran y la página conserva el scroll.
  - `/#apod` y `/#news` abren la terminal en esa vista; `/#contacto` no la abre.
  - Con `reducedMotion: 'reduce'` la terminal viva aparece ya escrita.
- **e2e existentes:** se adaptan para ejecutar comandos dentro de la terminal abierta (helper `Terminal.open()`); se mantienen todas las comprobaciones actuales (estilos cargados, noticias, APOD, chat, juegos, calculadora, contacto).
- **Unitarias:** datos (`projects`, `services`) y la lógica de qué hash abre la terminal.
- **Auditoría:** Lighthouse móvil en staging antes de la release (objetivo ≥ 90 en las cuatro categorías).

## 11. Entrega por fases

Cada fase es una PR contra `develop`, visible en `https://dev.gusi.dev` tras el merge. Producción no cambia hasta la release final.

1. **Base:** tokens `@theme`, fuentes autoalojadas, `src/data/*`, capturas de proyectos.
2. **Página y capa:** `SiteHeader`, `Hero` + `LiveTerminal`, `ProjectsSection`, `AboutSection`, `ContactSection`, `SiteFooter`, SEO, y la terminal actual (aspecto antiguo) ya dentro de `TerminalSheet` con apertura/cierre/historial/hash.
3. **Terminal:** estilos nuevos de todas las vistas, temas por variables, chips contextuales, ajuste al teclado móvil, `help` en dos grupos y comandos `proyectos`/`sobre-mi`.
4. **Limpieza y pulido:** eliminar código antiguo (§9), service worker v5, ajustes de rendimiento y accesibilidad según Lighthouse.
5. **Release** `develop → main` (merge commit).

## 12. Fuera de alcance

- CSP completa (C8): se facilita (fuentes autoalojadas) pero va en otra tarea.
- Blog, multidioma, modo claro.
- Cambios en la API del Worker (salvo lo necesario para el formulario).

## 13. Riesgos

- **Contenido real:** sin los textos del usuario la página no puede publicarse; se usarán borradores marcados y la release espera a su validación.
- **Teclado móvil:** el campo de entrada sobre el teclado varía entre iOS y Android; se prueba en ambos (Playwright emula, pero se confirma en dispositivo real).
- **Deep links antiguos** (`#cv`, `#projects`, `#menu`): `#cv` → abre `sobre-mi`; `#projects` → sección `#proyectos`; `#menu` → abre la terminal con `help`.

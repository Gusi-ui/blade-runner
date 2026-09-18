import type { TerminalSheet } from './sheet';

// Carga bajo demanda de la terminal: la página solo trae este módulo pequeño.
// Al abrirla por primera vez se descargan (una sola vez) las plantillas de las
// vistas (/terminal-vistas/), el controlador y el código de cada vista.

let loading: Promise<TerminalSheet> | null = null;

const loadTemplates = async (): Promise<void> => {
  const response = await fetch('/terminal-vistas/');
  if (!response.ok) return;
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  const templates = doc.getElementById('terminal-vistas');
  const holder = document.getElementById('terminal-view-templates');
  if (templates && holder) holder.replaceChildren(...Array.from(templates.children));

  // El visor a pantalla completa del APOD tiene que estar dentro de la capa: un
  // <dialog> modal queda por encima de todo lo que haya fuera de él.
  const overlay = document.getElementById('apod-fullscreen-overlay');
  const dialog = document.getElementById('terminal-sheet');
  if (overlay && dialog) dialog.append(overlay);
};

export const ensureTerminal = (): Promise<TerminalSheet> =>
  (loading ??= (async () => {
    const [, { mountTerminal }, ...views] = await Promise.all([
      loadTemplates(),
      import('./mount'),
      import('../views/news'),
      import('../views/apod'),
      import('../views/chat'),
      import('../views/games'),
      import('../views/calculator'),
    ]);
    // Las vistas escuchan 'loadView' antes de que el controlador navegue por hash.
    views.forEach(view => view.install());
    return mountTerminal();
  })().catch(error => {
    loading = null; // sin red: se reintenta en el próximo intento de abrirla
    throw error;
  }));

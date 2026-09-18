// Atajos que se muestran encima del campo de entrada según la vista activa.

const BASE = ['proyectos', 'sobre-mi', 'apod', 'news', 'chat', 'juegos'];
const IN_VIEW = ['proyectos', 'apod', 'news', 'chat', 'juegos'];

// Vistas cuyo nombre interno no coincide con el comando del atajo.
const CHIP_FOR_VIEW: Record<string, string> = { games: 'juegos' };

export const chipsFor = (view: string): string[] => {
  if (!view) return BASE;
  const current = CHIP_FOR_VIEW[view] ?? view;
  return [...IN_VIEW.filter(c => c !== current), 'clear'];
};

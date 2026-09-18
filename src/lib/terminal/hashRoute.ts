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

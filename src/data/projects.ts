// Proyectos reales en producción (textos validados por el usuario el 2026-09-18).
export interface Project {
  slug: string;
  name: string;
  url: string;
  summary: string;
  tags: string[];
  /** 'client': proyecto para un cliente (cuadrícula); 'own': negocio propio (franja aparte). */
  kind: 'client' | 'own';
  /** Etiqueta destacada (p. ej. 'Mi estudio' para alamia.es). */
  label?: string;
}

export const projects: Project[] = [
  {
    slug: 'viandalucia',
    name: 'viandalucia.org',
    url: 'https://viandalucia.org',
    summary:
      'Asociación de Vida Independiente de Andalucía: web migrada desde WordPress, más rápida y sin mantenimiento de plugins.',
    tags: ['Astro', 'Workers', 'R2', 'Turnstile'],
    kind: 'client',
  },
  {
    slug: 'divermataro',
    name: 'divermataro.org',
    url: 'https://divermataro.org',
    summary:
      'Asociación por la accesibilidad universal en Mataró: web accesible con blog y documentos gestionables.',
    tags: ['Astro', 'D1', 'Workers'],
    kind: 'client',
  },
  {
    slug: 'irenepuigdemont',
    name: 'irenepuigdemont.com',
    url: 'https://irenepuigdemont.com',
    summary:
      'Nutricionista especializada en autismo: web en tres idiomas con reserva de consultas online.',
    tags: ['Astro', 'D1', 'KV'],
    kind: 'client',
  },
  {
    slug: 'amparomedium',
    name: 'amparomedium.com',
    url: 'https://amparomedium.com',
    summary:
      'Guía espiritual: web con reserva de sesiones, área de clientes e inscripción a cursos.',
    tags: ['Next.js', 'React', 'Vercel'],
    kind: 'client',
  },
  {
    slug: 'alamia',
    name: 'alamia.es',
    url: 'https://alamia.es',
    summary:
      'Mi estudio para pequeños negocios: webs y mantenimiento con precio cerrado y contratación online.',
    tags: ['Astro', 'Workers', 'Pagos online'],
    kind: 'own',
    label: 'Mi estudio',
  },
];

export const clientProjects = (): Project[] => projects.filter(p => p.kind === 'client');

/** El estudio propio (alamia.es): se muestra aparte, como franja bajo los clientes. */
export const ownStudio = (): Project => {
  const studio = projects.find(p => p.kind === 'own');
  if (!studio) throw new Error('Falta el estudio propio en src/data/projects.ts');
  return studio;
};

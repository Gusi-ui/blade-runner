// Proyectos reales en producción. `summary`: BORRADOR, a validar por el usuario.
export interface Project {
  slug: string;
  name: string;
  url: string;
  summary: string;
  tags: string[];
  featured: boolean;
  /** Etiqueta destacada en la tarjeta (p. ej. 'Mi estudio' para alamia.es). */
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
    featured: true,
  },
  {
    slug: 'divermataro',
    name: 'divermataro.org',
    url: 'https://divermataro.org',
    summary:
      'Asociación por la accesibilidad universal en Mataró: web accesible con blog y documentos gestionables.',
    tags: ['Astro', 'D1', 'Workers'],
    featured: true,
  },
  {
    slug: 'irenepuigdemont',
    name: 'irenepuigdemont.com',
    url: 'https://irenepuigdemont.com',
    summary:
      'Nutricionista especializada en autismo: web en tres idiomas con reserva de consultas online.',
    tags: ['Astro', 'D1', 'KV'],
    featured: true,
  },
  {
    slug: 'alamia',
    name: 'alamia.es',
    url: 'https://alamia.es',
    summary:
      'Mi estudio para pequeños negocios: webs y mantenimiento con precio cerrado y contratación online.',
    tags: ['Astro', 'Workers', 'Pagos online'],
    featured: true,
    label: 'Mi estudio',
  },
];

export const featuredProjects = (): Project[] => projects.filter(p => p.featured);

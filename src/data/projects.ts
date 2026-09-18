// Proyectos reales en producción. `summary`: BORRADOR, a validar por el usuario.
export interface Project {
  slug: string;
  name: string;
  url: string;
  summary: string;
  tags: string[];
  featured: boolean;
}

export const projects: Project[] = [
  {
    slug: 'viandalucia',
    name: 'viandalucia.org',
    url: 'https://viandalucia.org',
    summary:
      'Web de asociación migrada desde WordPress: más rápida y sin mantenimiento de plugins.',
    tags: ['Astro', 'Workers', 'R2', 'Turnstile'],
    featured: true,
  },
  {
    slug: 'divermataro',
    name: 'divermataro.org',
    url: 'https://divermataro.org',
    summary: 'Web de club de buceo con gestión de contenidos propia.',
    tags: ['Astro', 'D1', 'Workers'],
    featured: true,
  },
  {
    slug: 'irenepuigdemont',
    name: 'irenepuigdemont.com',
    url: 'https://irenepuigdemont.com',
    summary: 'Web profesional con contenidos editables y carga instantánea.',
    tags: ['Astro', 'D1', 'KV'],
    featured: true,
  },
  {
    slug: 'alamia',
    name: 'alamia.es',
    url: 'https://alamia.es',
    summary: 'Web corporativa con formulario de contacto seguro en el borde.',
    tags: ['Workers', 'KV'],
    featured: true,
  },
];

export const featuredProjects = (): Project[] => projects.filter(p => p.featured);

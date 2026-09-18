// Contenido de «Sobre mí». BORRADOR: el usuario debe validar los textos antes de la release.
export interface Profile {
  name: string;
  role: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  about: string[];
  email: string;
  github: string;
  stack: string[];
}

export const profile: Profile = {
  name: 'Gusi',
  role: 'Desarrollador Full Stack',
  headline: 'Webs rápidas y a medida para tu',
  headlineAccent: 'negocio',
  intro:
    'Diseño, desarrollo y mantenimiento con Astro, TypeScript y Cloudflare. Migraciones desde WordPress.',
  about: [
    'Soy Gusi, desarrollador full stack. Construyo webs para negocios, asociaciones y profesionales que necesitan algo rápido, seguro y fácil de mantener.',
    'Trabajo de principio a fin: diseño, desarrollo, puesta en marcha y mantenimiento, y hablo contigo en tu idioma, sin tecnicismos.',
    'Para negocios que buscan algo sencillo tengo alamia.es, mi estudio con tarifas cerradas; aquí encontrarás además los proyectos a medida.',
  ],
  email: 'webmaster@gusi.dev',
  github: 'https://github.com/Gusi-ui',
  stack: ['Astro', 'TypeScript', 'Cloudflare Workers', 'Tailwind CSS', 'IA'],
};

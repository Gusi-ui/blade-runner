import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  site: 'https://gusi.dev', // Cambia esto a tu dominio personalizado
  // Si no usas dominio personalizado, descomenta la siguiente línea y comenta site:
  // site: 'https://gusi-ui.github.io',
  // base: '/blade-runner', // Solo necesario si no usas dominio personalizado
  build: {
    inlineStylesheets: 'auto',
  },
});

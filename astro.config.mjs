import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      // 0 = nada incrustado: Astro deja de meter los scripts pequeños dentro del
      // HTML y los emite como ficheros de /_astro/. Así la CSP puede ser estricta
      // (sin 'unsafe-inline' ni hashes que cambien en cada build).
      assetsInlineLimit: 0,
    },
  },
  output: 'static',
  site: 'https://gusi.dev',
  build: {
    inlineStylesheets: 'auto',
  },
});

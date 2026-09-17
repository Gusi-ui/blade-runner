import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'workers/src/**/*.test.ts'],
    // El volumen externo genera ficheros AppleDouble ('._*') que rompen esbuild
    exclude: ['**/._*', '**/node_modules/**'],
    environment: 'node',
  },
});

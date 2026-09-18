import { defineConfig, devices } from '@playwright/test';

// Pruebas end-to-end de la terminal.
// - Por defecto: compila la web y la sirve con `astro preview`; la API se simula
//   (e2e/fixtures.ts), así el CI no depende de NASA, noticias ni Workers AI.
// - E2E_LIVE=1: ejecuta las mismas pruebas contra producción con la API real.
// - PW_CHANNEL=chrome: usa el Chrome instalado (macOS 13 no admite el Chromium de Playwright).
const live = !!process.env.E2E_LIVE;
const baseURL = live ? process.env.E2E_BASE_URL || 'https://gusi.dev' : 'http://localhost:4329';

export default defineConfig({
  testDir: './e2e',
  timeout: live ? 60_000 : 30_000,
  expect: { timeout: live ? 20_000 : 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    channel: process.env.PW_CHANNEL,
    // El service worker saltaría las rutas simuladas y serviría cachés viejas.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL } },
  ],
  webServer: live
    ? undefined
    : {
        // La URL de API es ficticia: todas las llamadas a /api/* se interceptan.
        command:
          'pnpm exec astro build --outDir dist-e2e && pnpm exec astro preview --outDir dist-e2e --port 4329 --ignore-lock',
        env: { PUBLIC_API_BASE_URL: 'https://api.e2e.test' },
        url: 'http://localhost:4329',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});

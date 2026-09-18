// Captura la portada de cada proyecto (1280×800) en src/assets/projects/<slug>.png.
// Uso: PW_CHANNEL=chrome pnpm capture:projects   (Astro las convierte a WebP en el build)
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Duplicada a propósito de src/data/projects.ts (este script no se compila);
// src/data/data.test.ts comprueba que cada proyecto tiene su captura.
const targets = [
  ['viandalucia', 'https://viandalucia.org'],
  ['divermataro', 'https://divermataro.org'],
  ['irenepuigdemont', 'https://irenepuigdemont.com'],
  ['alamia', 'https://alamia.es'],
];

await mkdir('src/assets/projects', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
for (const [slug, url] of targets) {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Cierra avisos de cookies (se rechazan: no hace falta cargar analítica).
  await page
    .getByRole('button', { name: /^(rechazar|rechazar todo|aceptar)$/i })
    .first()
    .click({ timeout: 1500 })
    .catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `src/assets/projects/${slug}.png` });
  console.log(`✓ ${slug}`);
}
await browser.close();

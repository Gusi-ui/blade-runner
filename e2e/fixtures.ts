import { test as base, expect, type Page } from '@playwright/test';

// API simulada: respuestas fijas para que las pruebas sean deterministas.
// Con E2E_LIVE=1 no se instala y las pruebas usan la API real de producción.
export const live = !!process.env.E2E_LIVE;

// PNG 1x1 transparente para no descargar imágenes reales de la NASA.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

export const APOD_TODAY = {
  date: '2026-09-18',
  title: 'Pinwheel Galaxy',
  explanation: 'A magnificent face-on spiral galaxy.',
  url: 'https://apod.nasa.gov/apod/image/e2e.png',
  media_type: 'image',
};
export const APOD_RANDOM = { ...APOD_TODAY, date: '2001-01-01', title: 'Random Nebula' };

const article = (title: string, source: string) => ({
  title,
  description: `${title} description`,
  url: 'https://example.com/',
  publishedAt: new Date().toISOString(),
  source: { name: source },
});

export const NEWS = {
  all: [article('General headline', 'The Guardian'), article('Rust 2.0 released', 'Hacker News')],
  ai: [article('New LLM benchmark', 'Hacker News')],
  cosmos: [article('NASA launches probe', 'NASA')],
};

// La traducción simulada tarda un poco: así se comprueba que la vista no la espera.
export const TRANSLATE_DELAY_MS = 800;
export const translated = (text: string) => `ES: ${text}`;

const installApiMocks = async (page: Page): Promise<void> => {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });

    switch (url.pathname) {
      case '/api/health':
        return json({
          ok: true,
          endpoints: { apod: true, news: true, translate: true, chat: true },
        });
      case '/api/apod':
        return json(url.searchParams.get('random') === 'true' ? APOD_RANDOM : APOD_TODAY);
      case '/api/news': {
        const filter = (url.searchParams.get('filter') ?? 'all') as keyof typeof NEWS;
        return json({ articles: NEWS[filter] ?? NEWS.all });
      }
      case '/api/translate': {
        const { text } = route.request().postDataJSON() as { text: string };
        await new Promise(resolve => setTimeout(resolve, TRANSLATE_DELAY_MS));
        return json({ translatedText: translated(text) });
      }
      case '/api/chat':
        return route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
          body:
            'data: {"response":"Hola "}\n\n' +
            'data: {"choices":[{"delta":{"content":"humano"}}]}\n\n' +
            'data: [DONE]\n\n',
        });
      case '/api/contact':
        return json({ ok: true });
      default:
        return json({ error: 'not found' }, 404);
    }
  });

  await page.route('https://apod.nasa.gov/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL })
  );
  // Traductores externos de respaldo: nunca en las pruebas.
  await page.route(/translate\.googleapis\.com|mymemory\.translated\.net/, route => route.abort());
};

export const test = base.extend<{ terminal: Terminal }>({
  terminal: async ({ page }, use) => {
    if (!live) await installApiMocks(page);
    const terminal = new Terminal(page);
    await terminal.open();
    await use(terminal);
  },
});

export class Terminal {
  constructor(readonly page: Page) {}

  get input() {
    return this.page.locator('#terminal-input');
  }

  /** Último bloque impreso en la terminal. */
  get last() {
    return this.page.locator('#output-container .terminal-output').last();
  }

  get output() {
    return this.page.locator('#output-container');
  }

  async open(path = '/'): Promise<void> {
    await this.page.goto(path);
    await expect(this.page.getByText('Sistema listo')).toBeVisible();
  }

  async run(command: string): Promise<void> {
    await this.input.fill(command);
    await this.input.press('Enter');
  }
}

export { expect };

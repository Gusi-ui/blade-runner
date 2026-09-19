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
        const { text, texts } = route.request().postDataJSON() as {
          text?: string;
          texts?: string[];
        };
        await new Promise(resolve => setTimeout(resolve, TRANSLATE_DELAY_MS));
        return json(
          texts
            ? { translations: texts.map(t => (t ? translated(t) : t)) }
            : { translatedText: translated(text ?? '') }
        );
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
      case '/api/contact': {
        // Como el Worker real: sin token de Turnstile, 403.
        const body = route.request().postDataJSON() as Record<string, unknown>;
        return body['cf-turnstile-response'] === TURNSTILE_TEST_TOKEN
          ? json({ ok: true })
          : json({ ok: false, error: 'turnstile' }, 403);
      }
      default:
        return json({ error: 'not found' }, 404);
    }
  });

  // Efemérides de Wikipedia (calculadora): sin red, se usan las de respaldo.
  await page.route('https://api.wikimedia.org/**', route => route.abort());
  await page.route('https://apod.nasa.gov/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL })
  );
};

// Turnstile simulado: sin red ni reto real. Deja el token en el input oculto
// como el widget de verdad y cuenta los reinicios.
export const TURNSTILE_TEST_TOKEN = 'e2e-turnstile-token';
const TURNSTILE_STUB = `
  window.__turnstileResets = 0;
  window.turnstile = {
    render(el, opts) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'cf-turnstile-response';
      input.value = '${TURNSTILE_TEST_TOKEN}';
      el.appendChild(input);
      el.dataset.action = opts.action;
      return 'widget-1';
    },
    reset() { window.__turnstileResets++; },
  };`;

export const test = base.extend<{ terminal: Terminal; turnstileStub: void }>({
  turnstileStub: [
    async ({ page }, use) => {
      if (!live) {
        await page.route('https://challenges.cloudflare.com/turnstile/**', route =>
          route.fulfill({ status: 200, contentType: 'text/javascript', body: TURNSTILE_STUB })
        );
      }
      await use();
    },
    { auto: true },
  ],
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

  /** Carga la página y abre la terminal (si un enlace #vista no la abrió ya). */
  async open(path = '/'): Promise<void> {
    await this.page.goto(path);
    const dialog = this.page.locator('#terminal-sheet');
    await this.page.waitForLoadState('domcontentloaded');
    if (!(await dialog.evaluate(d => (d as HTMLDialogElement).open))) {
      await this.page.locator('[data-open-terminal]').first().click();
    }
    await expect(dialog).toBeVisible();
    await expect(this.input).toBeVisible();
  }

  async run(command: string): Promise<void> {
    await this.input.fill(command);
    await this.input.press('Enter');
  }
}

export { expect };

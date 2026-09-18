import {
  APOD_RANDOM,
  APOD_TODAY,
  NEWS,
  TRANSLATE_DELAY_MS,
  expect,
  live,
  test,
  translated,
} from './fixtures';

test.describe('carga de la página', () => {
  test('los estilos se aplican y no hay recursos rotos', async ({ page, baseURL }) => {
    // Registra respuestas >= 400 del propio sitio (p. ej. CSS con hash borrado).
    const origin = new URL(baseURL ?? '').origin;
    const broken: string[] = [];
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.origin === origin && response.status() >= 400) {
        broken.push(`${response.status()} ${url.pathname}`);
      }
    });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByText('Sistema listo')).toBeVisible();

    // Sin la hoja de estilos el fondo sería blanco y la pantalla no tendría borde.
    const styles = await page.evaluate(() => {
      const screen = document.querySelector('.terminal-screen');
      return {
        body: getComputedStyle(document.body).backgroundColor,
        border: screen ? getComputedStyle(screen).borderTopStyle : 'none',
        sheets: document.styleSheets.length,
      };
    });
    expect(styles.sheets).toBeGreaterThan(0);
    expect(styles.body).not.toBe('rgb(255, 255, 255)');
    expect(styles.body).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.border).not.toBe('none');

    await expect(page.locator('#terminal-input')).toBeVisible();
    expect(broken).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('un enlace profundo (#cv) abre la vista', async ({ terminal }) => {
    await terminal.open('/#cv');
    await expect(terminal.output.getByText('Currículum Vitae - Gusi')).toBeVisible();
  });
});

test.describe('comandos básicos', () => {
  test('help lista los comandos', async ({ terminal }) => {
    await terminal.run('help');
    await expect(terminal.last).toContainText('COMANDOS DISPONIBLES');
    await expect(terminal.last).toContainText('news [ai|cosmos|all]');
  });

  test('un comando desconocido muestra un error', async ({ terminal }) => {
    await terminal.run('comandoinexistente');
    await expect(terminal.last).toContainText("Comando 'comandoinexistente' no reconocido");
  });

  test('edad calcula la tabla de planetas', async ({ terminal }) => {
    await terminal.run('edad 1990-05-12');
    await expect(terminal.last).toContainText('Marte');
  });

  test('Tab autocompleta y ↑ recupera el historial', async ({ terminal }) => {
    await terminal.input.fill('noti');
    await terminal.input.press('Tab');
    await expect(terminal.input).toHaveValue('noticias');

    await terminal.run('whoami');
    await expect(terminal.last).toContainText('gusi@nexus');
    await terminal.input.press('ArrowUp');
    await expect(terminal.input).toHaveValue('whoami');
  });

  test('status informa de la API', async ({ terminal }) => {
    await terminal.run('status');
    await expect(terminal.last).toContainText('API Worker: OK');
  });
});

test.describe('menú y accesos rápidos', () => {
  test('pulsar una opción del menú abre su vista', async ({ terminal, page }) => {
    await terminal.run('menu');
    await terminal.last.locator('.menu-row[data-option="2"]').click();
    await expect(page).toHaveURL(/#cv$/);
    await expect(terminal.last).toContainText('Currículum Vitae - Gusi');
  });

  test('el chip APOD abre la imagen del día', async ({ terminal, page }) => {
    await page.locator('.quick-chip[data-cmd="apod"]').click();
    await expect(page).toHaveURL(/#apod$/);
    await expect(terminal.last.locator('.apod-title')).toBeVisible();
  });
});

test.describe('noticias', () => {
  test('cada filtro muestra noticias de su categoría', async ({ terminal }) => {
    await terminal.run('noticias');
    await expect(terminal.last.locator('.news-item').first()).toBeVisible();
    await expect(terminal.last.locator('.news-category')).toHaveText('Todas');

    await terminal.last.locator('#filter-cosmos').click();
    await expect(terminal.last.locator('.news-category')).toHaveText('Espacio y Ciencia');
    await expect(terminal.last.locator('.news-item').first()).toBeVisible();
    if (!live) {
      await expect(terminal.last).toContainText(NEWS.cosmos[0].title);
      await expect(terminal.last).not.toContainText(NEWS.all[0].title);
    }
  });

  test('news ai carga la categoría de IA', async ({ terminal }) => {
    await terminal.run('news ai');
    await expect(terminal.last.locator('.news-category')).toHaveText('IA y Tecnología');
    if (!live) await expect(terminal.last).toContainText(NEWS.ai[0].title);
  });

  test('se ven antes de traducir y luego se traducen', async ({ terminal }) => {
    test.skip(live, 'depende de la traducción simulada');
    await terminal.run('noticias');
    // Visible en inglés antes de que termine la traducción…
    await expect(terminal.last).toContainText(NEWS.all[0].title, {
      timeout: TRANSLATE_DELAY_MS - 200,
    });
    // …y sustituida por la traducción al llegar.
    await expect(terminal.last).toContainText(translated(NEWS.all[0].title));
    await expect(terminal.last.locator('.news-translating')).toHaveCount(0);
  });
});

test.describe('APOD', () => {
  test('muestra la imagen sin esperar a la traducción', async ({ terminal }) => {
    await terminal.run('apod');
    await expect(terminal.last.locator('.apod-image')).toBeVisible();
    if (!live) {
      await expect(terminal.last.locator('.apod-title')).toHaveText(APOD_TODAY.title, {
        timeout: TRANSLATE_DELAY_MS - 200,
      });
      await expect(terminal.last.locator('.apod-title')).toHaveText(translated(APOD_TODAY.title));
    }
  });

  test('apod random carga una imagen aleatoria', async ({ terminal }) => {
    await terminal.run('apod random');
    await expect(terminal.last.locator('.apod-title')).toBeVisible();
    if (!live) await expect(terminal.last.locator('.apod-title')).toContainText(APOD_RANDOM.title);
    await expect(terminal.last).not.toContainText('Última actualización: Nunca');
  });
});

test.describe('asistente IA', () => {
  test('el campo del chat es visible y la respuesta llega en streaming', async ({ terminal }) => {
    test.skip(live, 'no gastar peticiones reales de Workers AI');
    await terminal.run('chat');
    const input = terminal.last.locator('.chat-input');
    await expect(input).toBeVisible();
    expect((await input.boundingBox())?.width ?? 0).toBeGreaterThan(120);

    await input.fill('Hola');
    await terminal.last.locator('.chat-send').click();
    await expect(terminal.last.locator('.chat-messages')).toContainText('Hola humano');
  });

  test('ask responde en la propia terminal', async ({ terminal }) => {
    test.skip(live, 'no gastar peticiones reales de Workers AI');
    await terminal.run('ask hola');
    await expect(terminal.output).toContainText('Nexus-7: Hola humano');
  });
});

test.describe('juegos', () => {
  test('juegos 1 lanza Snake directamente', async ({ terminal }) => {
    await terminal.run('juegos 1');
    await expect(terminal.output.locator('canvas')).toHaveCount(1);
    await expect(terminal.output).toContainText('SNAKE GAME');
  });

  test('abrir juegos dos veces no lanza el juego dos veces', async ({ terminal }) => {
    await terminal.run('juegos');
    await terminal.run('juegos');
    await terminal.output.locator('[data-game="tetris"]').first().click();
    await expect(terminal.output).toContainText('TETRIS RETRO');
    await expect(terminal.output.getByText('TETRIS RETRO')).toHaveCount(1);
  });

  test('adivina el número acepta intentos', async ({ terminal }) => {
    await terminal.run('guess');
    await terminal.run('50');
    await expect(terminal.output).toContainText(/50 es demasiado|¡Correcto!/);
  });
});

test.describe('formularios', () => {
  test('la calculadora cósmica calcula la edad', async ({ terminal }) => {
    await terminal.run('calculadora');
    await terminal.last.locator('#birthdate').fill('1990-05-12');
    await terminal.last.locator('#calculator-submit').click();
    await expect(terminal.last.locator('#calculator-results')).toBeVisible();
  });

  test('el formulario de contacto envía el mensaje', async ({ terminal }) => {
    test.skip(live, 'no enviar correos reales');
    await terminal.run('contacto');
    const form = terminal.last.locator('form');
    await form.locator('[name="name"]').fill('Prueba');
    await form.locator('[name="email"]').fill('prueba@example.com');
    await form.locator('[name="message"]').fill('Mensaje de prueba e2e');
    await form.locator('button[type="submit"]').click();
    await expect(terminal.last).toContainText('Mensaje enviado');
  });
});

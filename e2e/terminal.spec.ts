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
    await page.locator('[data-open-terminal]').first().click();
    await expect(page.locator('#terminal-sheet')).toBeVisible();

    // Sin la hoja de estilos el fondo sería blanco y la barra de la capa no
    // tendría borde (la capa en sí no lo lleva en móvil: ocupa toda la pantalla).
    const styles = await page.evaluate(() => {
      const bar = document.querySelector('.terminal-sheet__bar');
      return {
        body: getComputedStyle(document.body).backgroundColor,
        border: bar ? getComputedStyle(bar).borderBottomStyle : 'none',
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

  test('un enlace profundo (#apod) abre la terminal en esa vista', async ({ terminal }) => {
    await terminal.open('/#apod');
    await expect(terminal.output).toContainText('Imagen Astronómica');
  });

  test('el enlace antiguo #cv lleva a «Sobre mí» de la página', async ({ page }) => {
    await page.goto('/#cv');
    await expect(page.locator('#terminal-sheet')).toBeHidden();
    await expect(page.locator('#sobre-mi')).toBeInViewport();
  });
});

test.describe('aspecto de la terminal', () => {
  test('usa la paleta nueva', async ({ terminal, page }) => {
    await terminal.run('help');
    const colors = await page.evaluate(() => {
      const sheet = document.getElementById('terminal-sheet')!;
      const bright = document.querySelector('#output-container .text-terminal-bright')!;
      return {
        bg: getComputedStyle(sheet).backgroundColor,
        bright: getComputedStyle(bright).color,
        shadow: getComputedStyle(bright).textShadow,
      };
    });
    expect(colors.bg).toBe('rgb(11, 13, 16)');
    expect(colors.bright).toBe('rgb(245, 247, 250)');
    expect(colors.shadow).toBe('none');
  });

  test('el tema ámbar cambia el acento', async ({ terminal, page }) => {
    await terminal.run('theme retro');
    const accent = await page.evaluate(() => ({
      sheet: getComputedStyle(document.getElementById('terminal-sheet')!)
        .getPropertyValue('--color-accent')
        .trim(),
      page: getComputedStyle(document.body).getPropertyValue('--color-accent').trim(),
    }));
    expect(accent.sheet).toBe('#fbbf24');
    expect(accent.page).toBe('#4ade80');
  });
});

test.describe('efecto retro', () => {
  test('apagado por defecto', async ({ terminal, page }) => {
    await terminal.run('help');
    await expect(page.locator('#terminal-sheet canvas.matrix-bg')).toHaveCount(0);
  });

  test('se activa desde config y dibuja dentro de la capa', async ({ terminal, page }) => {
    await terminal.run('config');
    await terminal.last.getByRole('button', { name: /efect/i }).first().click();
    await page.locator('[data-effect="toggle"]').last().click();
    await expect(page.locator('#terminal-sheet canvas.matrix-bg')).toHaveCount(1);
  });
});

test.describe('comandos básicos', () => {
  test('help lista los comandos', async ({ terminal }) => {
    await terminal.run('help');
    await expect(terminal.last).toContainText('Destacados');
    await expect(terminal.last).toContainText('Laboratorio');
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
  test('menu muestra la ayuda y sobre-mi el contenido real', async ({ terminal }) => {
    await terminal.run('menu');
    await expect(terminal.last).toContainText('Destacados');
    await terminal.run('cv');
    await expect(terminal.last).toContainText('Hola, soy Gusi');
    await expect(terminal.last).toContainText('250 €');
    await terminal.run('proyectos');
    await expect(terminal.last).toContainText('alamia.es');
  });

  test('contacto cierra la terminal y lleva al formulario', async ({ terminal, page }) => {
    await terminal.run('contacto');
    await expect(page.locator('#terminal-sheet')).toBeHidden();
    await expect(page.locator('#contacto form')).toBeInViewport();
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

  test('la calculadora muestra zodiaco, planetas y efemérides', async ({ terminal }) => {
    await terminal.run('calculadora');
    await terminal.last.locator('#birthdate').fill('1990-05-12');
    await terminal.last.locator('#calculator-submit').click();
    await expect(terminal.last).toContainText('Tauro');
    await expect(terminal.last).toContainText('Marte');
    await expect(terminal.last.locator('#calc-events')).not.toContainText('Buscando');
    await expect(terminal.last.locator('#calc-solar')).toBeVisible();
  });

  test('la segunda calculadora también responde', async ({ terminal }) => {
    await terminal.run('calculadora');
    await terminal.run('calculadora');
    await terminal.last.locator('#birthdate').fill('2000-01-01');
    await terminal.last.locator('#calculator-submit').click();
    await expect(terminal.last.locator('#calculator-results')).toBeVisible();
  });

  test('el formulario de contacto envía el mensaje', async ({ terminal, page }) => {
    test.skip(live, 'no enviar correos reales');
    // El fixture instala la API simulada y abre la terminal: se cierra y se usa la página.
    await terminal.page.keyboard.press('Escape');
    await expect(page.locator('#terminal-sheet')).toBeHidden();
    const form = page.locator('#contacto form');
    await form.locator('[name="name"]').fill('Prueba');
    await form.locator('[name="email"]').fill('prueba@example.com');
    await form.locator('[name="message"]').fill('Mensaje de prueba e2e');
    await form.locator('button[type="submit"]').click();
    await expect(form).toContainText('Mensaje enviado');
  });
});

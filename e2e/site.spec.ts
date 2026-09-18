import { expect, test } from '@playwright/test';

test.describe('página', () => {
  test('el HTML servido incluye el contenido profesional y el JSON-LD', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Webs rápidas y a medida');
    expect(html).toContain('"@type":"ProfessionalService"');
    expect(html).toContain('<meta name="description"');
  });
});

test.describe('presentación', () => {
  test('la presentación y los botones llevan a su sitio', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Webs rápidas');
    await expect(page.locator('[data-cta="header"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hablemos' })).toHaveAttribute('href', '#contacto');
  });

  test('con movimiento reducido la terminal viva aparece ya escrita', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('[data-live-output]')).toContainText('webs en producción');
    await ctx.close();
  });
});

test.describe('secciones', () => {
  test('secciones visibles y «Hablemos» lleva al formulario', async ({ page }) => {
    await page.goto('/');
    for (const id of ['proyectos', 'sobre-mi', 'contacto']) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.locator('#proyectos li')).toHaveCount(4);
    await expect(page.locator('#proyectos li')).toContainText(['amparomedium.com']);
    const studio = page.getByRole('complementary', { name: 'Mi estudio' });
    await expect(studio).toContainText('alamia.es');
    await expect(page.locator('#proyectos li').filter({ hasText: 'alamia.es' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Hablemos' }).click();
    await expect(page.locator('#contacto form')).toBeInViewport();
    await expect(page.locator('#terminal-sheet')).toBeHidden();
  });

  test('no hay scroll horizontal', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('las capturas de los proyectos cargan', async ({ page }) => {
    await page.goto('/');
    // La captura de la franja del estudio solo se muestra desde sm (en móvil va oculta).
    const imgs = page.locator('#proyectos li img');
    for (const img of await imgs.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveJSProperty('complete', true);
      expect(await img.evaluate(i => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(img).not.toHaveCSS('opacity', '0');
    }
  });

  test('las tarifas enlazan a alamia.es y lo a medida al formulario', async ({ page }) => {
    await page.goto('/');
    const about = page.locator('#sobre-mi');
    await expect(about.getByRole('link', { name: /Contratar en alamia\.es/ })).toHaveCount(4);
    await expect(about.getByRole('link', { name: /Pedir presupuesto/ })).toHaveAttribute(
      'href',
      '#contacto'
    );
    await expect(about).toContainText('250 €');
  });
});

test.describe('terminal en capa', () => {
  test('se abre al tocar y se cierra con ✕, Esc y atrás', async ({ page }) => {
    await page.goto('/');
    const sheet = page.locator('#terminal-sheet');
    await expect(sheet).toBeHidden();

    await page.locator('[data-open-terminal]').first().click();
    await expect(sheet).toBeVisible();
    await page.locator('[data-close-terminal]').click();
    await expect(sheet).toBeHidden();

    await page.locator('[data-open-terminal]').first().click();
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    await page.locator('[data-open-terminal]').first().click();
    await expect(sheet).toBeVisible();
    await page.goBack();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });

  test('la cabecera de la capa no se desplaza al ejecutar comandos', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-terminal]').first().click();
    for (const cmd of ['help', 'help', 'edad 1990-05-12']) {
      await page.locator('#terminal-input').fill(cmd);
      await page.locator('#terminal-input').press('Enter');
    }
    const top = await page
      .locator('.terminal-sheet__bar')
      .evaluate(el => el.getBoundingClientRect().top);
    expect(Math.round(top)).toBeGreaterThanOrEqual(0);
    const sheetTop = await page.locator('#terminal-sheet').evaluate(d => d.scrollTop);
    expect(sheetTop).toBe(0);
  });

  test('recién abierta, la entrada queda abajo de la pantalla', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-terminal]').first().click();
    const gap = await page.evaluate(() => {
      const footer = document.querySelector('.terminal-footer')!.getBoundingClientRect();
      const sheet = document.getElementById('terminal-sheet')!.getBoundingClientRect();
      return sheet.bottom - footer.bottom;
    });
    expect(gap).toBeLessThan(2);
  });

  test('los atajos y la ruta cambian con la vista', async ({ page }) => {
    await page.goto('/#news');
    const chips = page.locator('#quick-actions .quick-chip');
    await expect(chips.last()).toHaveText('clear');
    await expect(page.locator('#sheet-path')).toHaveText('~/news');
    await chips.filter({ hasText: 'proyectos' }).click();
    await expect(page.locator('#output-container')).toContainText('viandalucia.org');
    await chips.filter({ hasText: 'clear' }).click();
    await expect(page.locator('#sheet-path')).toHaveText('~/');
    await expect(chips.first()).toHaveText('proyectos');
  });

  test('un enlace #apod abre la terminal en esa vista', async ({ page }) => {
    await page.goto('/#apod');
    await expect(page.locator('#terminal-sheet')).toBeVisible();
    await expect(page.locator('#output-container')).toContainText('Imagen Astronómica');
  });

  test('un enlace de sección no abre la terminal', async ({ page }) => {
    await page.goto('/#contacto');
    await expect(page.locator('#terminal-sheet')).toBeHidden();
  });
});

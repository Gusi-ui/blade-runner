import { expect, test } from '@playwright/test';

test.describe('página', () => {
  test('el HTML servido incluye el contenido profesional y el JSON-LD', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Webs rápidas y a medida');
    expect(html).toContain('"@type":"ProfessionalService"');
    expect(html).toContain('<meta name="description"');
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

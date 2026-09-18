import { expect, test } from '@playwright/test';

test.describe('página', () => {
  test('el HTML servido incluye el contenido profesional y el JSON-LD', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Webs rápidas y a medida');
    expect(html).toContain('"@type":"ProfessionalService"');
    expect(html).toContain('<meta name="description"');
  });
});

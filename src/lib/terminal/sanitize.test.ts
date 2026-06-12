import { describe, expect, it } from 'vitest';
import { escapeHtml } from './sanitize';

describe('escapeHtml', () => {
  it('escapa etiquetas HTML', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapa atributos y entidades', () => {
    expect(escapeHtml(`<img src=x onerror="alert('xss')">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;'
    );
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('no altera texto normal con acentos', () => {
    expect(escapeHtml('calculadora cósmica ¿qué?')).toBe('calculadora cósmica ¿qué?');
  });
});

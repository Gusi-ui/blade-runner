import { describe, expect, it } from 'vitest';
import { escapeHtml, safeUrl } from './sanitize';

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

describe('safeUrl', () => {
  it('acepta URLs http(s) y escapa comillas', () => {
    expect(safeUrl('https://apod.nasa.gov/a.jpg')).toBe('https://apod.nasa.gov/a.jpg');
    expect(safeUrl('https://x.dev/?q="a"&b=1')).toBe('https://x.dev/?q=%22a%22&amp;b=1');
  });

  it('bloquea esquemas peligrosos o inválidos', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl(' JavaScript:alert(1)')).toBe('#');
    expect(safeUrl('data:text/html,<script>')).toBe('#');
    expect(safeUrl('no es una url')).toBe('#');
    expect(safeUrl(undefined)).toBe('#');
  });
});

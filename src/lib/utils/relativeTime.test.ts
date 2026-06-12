import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './relativeTime';

const NOW = new Date('2026-06-12T12:00:00Z');

describe('formatRelativeTime', () => {
  it('formatea minutos y horas', () => {
    expect(formatRelativeTime('2026-06-12T11:55:00Z', NOW)).toBe('hace 5 minutos');
    expect(formatRelativeTime('2026-06-12T09:00:00Z', NOW)).toBe('hace 3 horas');
  });

  it('formatea días con numeric auto ("ayer")', () => {
    expect(formatRelativeTime('2026-06-11T12:00:00Z', NOW)).toBe('ayer');
    expect(formatRelativeTime('2026-06-09T12:00:00Z', NOW)).toBe('hace 3 días');
  });

  it('formatea semanas, meses y años', () => {
    expect(formatRelativeTime('2026-05-29T12:00:00Z', NOW)).toBe('hace 2 semanas');
    expect(formatRelativeTime('2026-03-12T12:00:00Z', NOW)).toBe('hace 3 meses');
    expect(formatRelativeTime('2024-06-12T12:00:00Z', NOW)).toBe('hace 2 años');
  });

  it('trata lo muy reciente como "hace un momento"', () => {
    expect(formatRelativeTime('2026-06-12T11:59:30Z', NOW)).toBe('hace un momento');
  });

  it('devuelve cadena vacía para fechas inválidas', () => {
    expect(formatRelativeTime('no-es-fecha', NOW)).toBe('');
  });
});

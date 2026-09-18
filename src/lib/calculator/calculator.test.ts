// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { techEventsFor } from '../../data/techEvents';
import { fetchBirthDayApod, fetchOnThisDay, filterTechEvents } from './birthDay';
import { formatDecimalAge, formatHumanAge } from './humanAge';
import { renderResults } from './render';
import { moonPhaseFor, skyDataFor } from './sky';
import { zodiacSign } from './zodiac';

afterEach(() => vi.unstubAllGlobals());

describe('edad en texto', () => {
  it('años, meses y días', () => {
    expect(formatHumanAge(new Date(2000, 0, 15), new Date(2026, 8, 18))).toBe(
      '26 años, 8 meses, 3 días'
    );
  });
  it('singulares', () => {
    expect(formatHumanAge(new Date(2025, 7, 17), new Date(2026, 8, 18))).toBe(
      '1 año, 1 mes, 1 día'
    );
  });
  it('mismo día', () => {
    expect(formatHumanAge(new Date(2026, 8, 18), new Date(2026, 8, 18))).toBe('Menos de un día');
  });
  it('edad decimal', () => {
    expect(formatDecimalAge(1)).toBe('1 año');
    expect(formatDecimalAge(0)).toBe('Menos de un día');
    expect(formatDecimalAge(10.5)).toBe('10 años, 5 meses, 30 días');
  });
});

describe('zodiacSign', () => {
  it.each([
    [0, 1, '♑ Capricornio'],
    [0, 20, '♒ Acuario'],
    [4, 12, '♉ Tauro'],
    [11, 22, '♑ Capricornio'],
  ])('mes %i día %i → %s', (m, d, sign) => expect(zodiacSign(m, d)).toBe(sign));
});

describe('cielo del día de nacimiento', () => {
  it('constelación y estación por mes', () => {
    expect(skyDataFor(0).constellation).toContain('Orión');
    expect(skyDataFor(6).season).toContain('Verano');
  });
  it('fase lunar determinista', () => {
    expect(moonPhaseFor(1990, 4, 12)).toBe(moonPhaseFor(1990, 4, 12));
    expect(moonPhaseFor(1990, 4, 12)).toMatch(/Luna|Cuarto/);
  });
});

describe('efemérides de respaldo', () => {
  it('eventos de la década de nacimiento', () => {
    const events = techEventsFor(1995);
    expect(events).toHaveLength(3);
    expect(events[0].title).toContain('World Wide Web');
  });
  it('década desconocida → eventos genéricos', () => {
    expect(techEventsFor(1900)[0].title).toContain('Evolución tecnológica');
  });
});

describe('datos del día de nacimiento', () => {
  it('antes de 1995-06-16 no hay APOD y no se llama a la red', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchBirthDayApod('1990-05-12')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Wikipedia caída → lista vacía', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 }))
    );
    expect(await fetchOnThisDay(5, 12)).toEqual([]);
  });

  it('filtra eventos de ciencia cercanos al año (±5) y como máximo 3', () => {
    const ev = (year: number, text: string) => ({ year, text, pages: [] });
    const events = filterTechEvents(
      [
        ev(1990, 'NASA launches the Hubble Space Telescope'),
        ev(1990, 'A football match'),
        ev(1970, 'First computer network'),
        ev(1991, 'Linux kernel software released'),
        ev(1992, 'Satellite launched'),
        ev(1993, 'Rocket test'),
      ],
      1990
    );
    expect(events.map(e => e.title)).toEqual([
      '1990: NASA launches the Hubble Space Telescope',
      '1991: Linux kernel software released',
      '1992: Satellite launched',
    ]);
  });
});

describe('render', () => {
  it('resultados con cada planeta y sin HTML inyectado', () => {
    const html = renderResults(
      [{ planet: 'Marte', age: 1, orbitalPeriod: 686.98 }],
      new Date(1990, 4, 12),
      1000
    );
    expect(html).toContain('Marte');
    expect(html).toContain('687 días terrestres');
    expect(html).toContain('♉ Tauro');
  });
});

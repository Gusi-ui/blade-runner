import { describe, expect, it } from 'vitest';
import { chipsFor } from './chips';

describe('chipsFor', () => {
  it('fuera de una vista ofrece lo principal', () => {
    expect(chipsFor('')).toEqual(['proyectos', 'sobre-mi', 'apod', 'news', 'chat', 'juegos']);
  });

  it('dentro de una vista quita la actual y añade clear', () => {
    expect(chipsFor('news')).toEqual(['proyectos', 'apod', 'chat', 'juegos', 'clear']);
  });

  it('las vistas con nombre interno distinto también se quitan', () => {
    expect(chipsFor('games')).toEqual(['proyectos', 'apod', 'news', 'chat', 'clear']);
  });
});

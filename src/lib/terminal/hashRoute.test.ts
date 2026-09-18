import { describe, expect, it } from 'vitest';
import { classifyHash } from './hashRoute';

const isView = (t: string) => ['news', 'apod', 'cv', 'juegos', 'menu'].includes(t);

describe('classifyHash', () => {
  it.each([
    ['', { kind: 'none' }],
    ['#', { kind: 'none' }],
    ['#proyectos', { kind: 'section', id: 'proyectos' }],
    ['#sobre-mi', { kind: 'section', id: 'sobre-mi' }],
    ['#contacto', { kind: 'section', id: 'contacto' }],
    ['#projects', { kind: 'section', id: 'proyectos' }],
    ['#terminal', { kind: 'terminal' }],
    ['#apod', { kind: 'view', token: 'apod' }],
    ['#/news', { kind: 'view', token: 'news' }],
    ['#APOD', { kind: 'view', token: 'apod' }],
    ['#desconocido', { kind: 'none' }],
  ])('%s', (hash, expected) => {
    expect(classifyHash(hash, isView)).toEqual(expected);
  });
});

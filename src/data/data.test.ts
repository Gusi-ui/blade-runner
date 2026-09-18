import { describe, expect, it } from 'vitest';
import { profile } from './profile';
import { clientProjects, ownStudio, projects } from './projects';
import { ALAMIA_URL, services } from './services';

describe('datos del sitio', () => {
  it('los proyectos tienen slug único y URL https', () => {
    const slugs = projects.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of projects) expect(p.url).toMatch(/^https:\/\//);
  });

  it('los proyectos de clientes son las 4 webs reales', () => {
    expect(clientProjects().map(p => p.slug)).toEqual([
      'viandalucia',
      'divermataro',
      'irenepuigdemont',
      'amparomedium',
    ]);
  });

  it('las tarifas cerradas enlazan a alamia.es y hay una opción a medida', () => {
    for (const s of services) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.description.length).toBeGreaterThan(10);
      expect(s.href === ALAMIA_URL || s.href === '#contacto').toBe(true);
    }
    const fixed = services.filter(s => s.href === ALAMIA_URL);
    expect(fixed.map(s => s.price)).toEqual(['250 €', '190 €', '400 €', '10 €']);
    expect(services.at(-1)?.price).toBe('A medida');
  });

  it('alamia.es es el estudio propio y va aparte de los clientes', () => {
    expect(ownStudio().slug).toBe('alamia');
    expect(ownStudio().label).toBe('Mi estudio');
    expect(clientProjects().some(p => p.kind === 'own')).toBe(false);
  });

  it('el perfil tiene email y GitHub válidos', () => {
    expect(profile.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    expect(profile.github).toMatch(/^https:\/\/github\.com\//);
  });

  it('cada proyecto tiene su captura', () => {
    const shots = Object.keys(import.meta.glob('../assets/projects/*.png'));
    for (const p of projects) {
      expect(shots).toContain(`../assets/projects/${p.slug}.png`);
    }
  });
});

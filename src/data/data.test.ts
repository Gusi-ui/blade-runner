import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { profile } from './profile';
import { featuredProjects, projects } from './projects';
import { services } from './services';

describe('datos del sitio', () => {
  it('los proyectos tienen slug único y URL https', () => {
    const slugs = projects.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of projects) expect(p.url).toMatch(/^https:\/\//);
  });

  it('los destacados son las 4 webs reales de la spec', () => {
    expect(featuredProjects().map(p => p.slug)).toEqual([
      'viandalucia',
      'divermataro',
      'irenepuigdemont',
      'alamia',
    ]);
  });

  it('hay 3 servicios con título y descripción', () => {
    expect(services).toHaveLength(3);
    for (const s of services) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.description.length).toBeGreaterThan(10);
    }
  });

  it('el perfil tiene email y GitHub válidos', () => {
    expect(profile.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    expect(profile.github).toMatch(/^https:\/\/github\.com\//);
  });

  it('cada proyecto tiene su captura', () => {
    for (const p of projects) {
      expect(existsSync(`src/assets/projects/${p.slug}.png`)).toBe(true);
    }
  });
});

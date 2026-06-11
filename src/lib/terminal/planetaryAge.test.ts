import { describe, expect, it } from 'vitest';
import { calculatePlanetaryAges } from './planetaryAge';

describe('calculatePlanetaryAges', () => {
  it('calculates Earth age close to calendar years', () => {
    const birthdate = '2000-01-01';
    const ages = calculatePlanetaryAges(birthdate);
    const earth = ages.find(a => a.planet === 'Tierra');
    expect(earth).toBeDefined();
    expect(earth!.age).toBeGreaterThan(20);
  });

  it('returns all planets', () => {
    const ages = calculatePlanetaryAges('1990-06-15');
    expect(ages).toHaveLength(8);
    expect(ages.map(a => a.planet)).toContain('Marte');
  });
});

// Periodos orbitales en días terrestres (fuente única para `edad` y la calculadora).
export const ORBITAL_PERIODS: Record<string, number> = {
  Mercurio: 87.97,
  Venus: 224.7,
  Tierra: 365.26,
  Marte: 686.98,
  Júpiter: 4332.59,
  Saturno: 10759.22,
  Urano: 30688.5,
  Neptuno: 60182,
};

export interface PlanetaryAge {
  planet: string;
  age: number;
  orbitalPeriod: number;
}

export const planetaryAgesFromDays = (days: number): PlanetaryAge[] =>
  Object.entries(ORBITAL_PERIODS).map(([planet, orbitalPeriod]) => ({
    planet,
    orbitalPeriod,
    age: days / orbitalPeriod,
  }));

export const calculatePlanetaryAges = (birthdate: string): { planet: string; age: number }[] => {
  const days = (Date.now() - new Date(birthdate).getTime()) / 86_400_000;
  return planetaryAgesFromDays(days).map(({ planet, age }) => ({
    planet,
    age: Math.round(age * 100) / 100,
  }));
};

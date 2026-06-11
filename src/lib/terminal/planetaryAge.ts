const ORBITAL_PERIODS: Record<string, number> = {
  Mercurio: 87.97,
  Venus: 224.7,
  Tierra: 365.26,
  Marte: 686.98,
  Júpiter: 4332.59,
  Saturno: 10759.22,
  Urano: 30688.5,
  Neptuno: 60182,
};

export const calculatePlanetaryAges = (birthdate: string): { planet: string; age: number }[] => {
  const birth = new Date(birthdate);
  const daysAlive = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24);

  return Object.entries(ORBITAL_PERIODS).map(([planet, period]) => ({
    planet,
    age: Math.round((daysAlive / period) * 100) / 100,
  }));
};

// Datos del cielo para fechas sin foto de la NASA (antes del 16/06/1995).

export interface SkyData {
  constellation: string;
  season: string;
  fact: string;
}

const SKY_BY_MONTH: SkyData[] = [
  {
    constellation: '🌟 Orión',
    season: '❄️ Invierno (hemisferio norte)',
    fact: 'Orión es una de las constelaciones más reconocibles del cielo nocturno, visible desde ambos hemisferios.',
  },
  {
    constellation: '🌟 Géminis',
    season: '❄️ Invierno (hemisferio norte)',
    fact: 'En febrero, la constelación de Géminis alcanza su punto más alto en el cielo nocturno.',
  },
  {
    constellation: '🌟 Leo',
    season: '🌸 Primavera (hemisferio norte)',
    fact: 'Leo es una de las constelaciones del zodíaco más brillantes, con su estrella principal Regulus.',
  },
  {
    constellation: '🌟 Virgo',
    season: '🌸 Primavera (hemisferio norte)',
    fact: 'Virgo contiene uno de los cúmulos de galaxias más grandes conocidos: el Cúmulo de Virgo.',
  },
  {
    constellation: '🌟 Boyero',
    season: '🌸 Primavera (hemisferio norte)',
    fact: 'El Boyero contiene a Arturo, la tercera estrella más brillante del cielo nocturno.',
  },
  {
    constellation: '🌟 Escorpio',
    season: '☀️ Verano (hemisferio norte)',
    fact: 'Escorpio contiene la supergigante roja Antares, una estrella 850 veces más grande que el Sol.',
  },
  {
    constellation: '🌟 Sagitario',
    season: '☀️ Verano (hemisferio norte)',
    fact: 'Sagitario apunta hacia el centro de nuestra galaxia, la Vía Láctea.',
  },
  {
    constellation: '🌟 Cisne',
    season: '☀️ Verano (hemisferio norte)',
    fact: 'El Cisne es prominente en verano y forma parte del famoso «Triángulo de Verano».',
  },
  {
    constellation: '🌟 Acuario',
    season: '🍂 Otoño (hemisferio norte)',
    fact: 'Acuario es una de las constelaciones más antiguas reconocidas, desde la Mesopotamia.',
  },
  {
    constellation: '🌟 Pegaso',
    season: '🍂 Otoño (hemisferio norte)',
    fact: 'Pegaso es famoso por el «Cuadrado de Pegaso», un asterismo fácilmente reconocible.',
  },
  {
    constellation: '🌟 Andrómeda',
    season: '🍂 Otoño (hemisferio norte)',
    fact: 'Andrómeda contiene la galaxia más cercana a la Vía Láctea, visible a simple vista en cielos oscuros.',
  },
  {
    constellation: '🌟 Tauro',
    season: '❄️ Invierno (hemisferio norte)',
    fact: 'Tauro contiene las Pléyades, uno de los cúmulos de estrellas jóvenes más cercanos.',
  },
];

export const skyDataFor = (month: number): SkyData => SKY_BY_MONTH[month] ?? SKY_BY_MONTH[0];

const MOON_PHASES = [
  '🌑 Luna nueva',
  '🌒 Luna creciente',
  '🌓 Cuarto creciente',
  '🌔 Luna gibosa creciente',
  '🌕 Luna llena',
  '🌖 Luna gibosa menguante',
  '🌗 Cuarto menguante',
  '🌘 Luna menguante',
];

/** Fase lunar aproximada (la misma fórmula de siempre: orientativa, no astronómica). */
export const moonPhaseFor = (year: number, month: number, day: number): string =>
  MOON_PHASES[Math.floor((((year + month + day) % 29.53) / 29.53) * 8) % 8];

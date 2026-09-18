// Signo del zodiaco por fecha (mes 0–11). Cada entrada: último día del signo.
const SIGNS: { sign: string; end: [number, number] }[] = [
  { sign: '♑ Capricornio', end: [0, 19] },
  { sign: '♒ Acuario', end: [1, 18] },
  { sign: '♓ Piscis', end: [2, 20] },
  { sign: '♈ Aries', end: [3, 19] },
  { sign: '♉ Tauro', end: [4, 20] },
  { sign: '♊ Géminis', end: [5, 20] },
  { sign: '♋ Cáncer', end: [6, 22] },
  { sign: '♌ Leo', end: [7, 22] },
  { sign: '♍ Virgo', end: [8, 22] },
  { sign: '♎ Libra', end: [9, 22] },
  { sign: '♏ Escorpio', end: [10, 21] },
  { sign: '♐ Sagitario', end: [11, 21] },
];

export const zodiacSign = (month: number, day: number): string =>
  SIGNS.find(({ end: [m, d] }) => month < m || (month === m && day <= d))?.sign ?? SIGNS[0].sign;

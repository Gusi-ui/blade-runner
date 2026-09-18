// Edad en texto («26 años, 8 meses, 3 días») para la calculadora cósmica.

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

const join = (years: number, months: number, days: number): string =>
  [
    years > 0 && plural(years, 'año', 'años'),
    months > 0 && plural(months, 'mes', 'meses'),
    days > 0 && plural(days, 'día', 'días'),
  ]
    .filter(Boolean)
    .join(', ') || 'Menos de un día';

/** Edad exacta según el calendario entre dos fechas. */
export const formatHumanAge = (birth: Date, today: Date = new Date()): string => {
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return join(years, months, days);
};

/** Edad aproximada a partir de años decimales (edad en otro planeta). */
export const formatDecimalAge = (decimalAge: number): string => {
  const years = Math.floor(decimalAge);
  const remainingDays = (decimalAge - years) * 365.25;
  return join(years, Math.floor(remainingDays / 30.44), Math.floor(remainingDays % 30.44));
};

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
];

/**
 * Formatea una fecha como tiempo relativo en español ("hace 3 horas", "ayer").
 * Devuelve la fecha localizada si no es válida la conversión relativa.
 */
export const formatRelativeTime = (isoDate: string, now: Date = new Date()): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const elapsedSeconds = (date.getTime() - now.getTime()) / 1000;
  const absSeconds = Math.abs(elapsedSeconds);

  if (absSeconds < 60) return 'hace un momento';

  for (const { unit, seconds } of UNITS) {
    if (absSeconds >= seconds) {
      return rtf.format(Math.round(elapsedSeconds / seconds), unit);
    }
  }
  return 'hace un momento';
};

export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Devuelve una URL apta para interpolar en href/src: solo http(s), normalizada
 * y escapada. Cualquier otra cosa (javascript:, data:, basura) se convierte en '#'.
 * Úsala con URLs que vengan de APIs externas (noticias, NASA, Wikipedia).
 */
export const safeUrl = (url: string | undefined | null): string => {
  if (!url) return '#';
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '#';
    return escapeHtml(parsed.href);
  } catch {
    return '#';
  }
};

export interface TranslateResult {
  text: string;
  translated: boolean;
}

// El Worker traduce con un LLM (varios segundos en textos largos) y cachea en KV.
const TIMEOUT_MS = 20000;
// Debe coincidir con TRANSLATE_MAX_BATCH / TRANSLATE_MAX_CHARS del Worker.
const MAX_BATCH = 20;
const MAX_CHARS = 5000;

const postTranslate = async <T>(apiBase: string, body: unknown): Promise<T | null> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${apiBase}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
};

const untranslated = (text: string): TranslateResult => ({ text, translated: false });

/**
 * Traduce varios textos en una sola petición al Worker. Si la traducción no
 * está disponible, devuelve los originales (translated: false): nunca lanza.
 * Ya no hay respaldo directo a Google/MyMemory desde el navegador.
 */
export const translateBatch = async (
  texts: string[],
  apiBase = import.meta.env.PUBLIC_API_BASE_URL || ''
): Promise<TranslateResult[]> => {
  if (!apiBase) return texts.map(untranslated);

  const results: TranslateResult[] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const chunk = texts.slice(i, i + MAX_BATCH).map(t => (t ?? '').slice(0, MAX_CHARS));
    const data = await postTranslate<{ translations?: string[] }>(apiBase, { texts: chunk });
    chunk.forEach((text, j) => {
      const translated = data?.translations?.[j];
      results.push(
        text.trim() && translated?.trim()
          ? { text: translated, translated: true }
          : untranslated(text)
      );
    });
  }
  return results;
};

export const translateToSpanish = async (
  text: string,
  apiBase = import.meta.env.PUBLIC_API_BASE_URL || ''
): Promise<TranslateResult> => {
  if (!text?.trim()) return untranslated(text || '');
  const [result] = await translateBatch([text], apiBase);
  return result;
};

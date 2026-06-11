export interface TranslateResult {
  text: string;
  translated: boolean;
}

const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.length > 0) chunks.push(currentChunk.trim());
  return chunks;
};

const translateSinglePart = async (text: string, apiBase: string): Promise<string | null> => {
  if (apiBase) {
    try {
      const response = await fetch(`${apiBase}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'en', target: 'es' }),
      });
      if (response.ok) {
        const data = (await response.json()) as { translatedText?: string };
        if (data.translatedText?.trim()) return data.translatedText;
      }
    } catch {
      /* fallback to client methods */
    }
  }

  const maxRetries = 2;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const googleResponse = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
      );
      if (googleResponse.ok) {
        const data = await googleResponse.json();
        if (data?.[0] && Array.isArray(data[0])) {
          const translatedText = data[0].map((item: unknown[]) => (item as string[])[0]).join('');
          if (translatedText?.trim()) return translatedText;
        }
      }

      const myMemoryResponse = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`
      );
      if (myMemoryResponse.ok) {
        const data = await myMemoryResponse.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch {
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
  }

  return null;
};

export const translateToSpanish = async (
  text: string,
  apiBase = import.meta.env.PUBLIC_API_BASE_URL || ''
): Promise<TranslateResult> => {
  if (!text?.trim()) return { text: text || '', translated: false };

  try {
    const chunks = splitTextIntoChunks(text, 4500);
    const translatedChunks: string[] = [];
    let anyTranslated = false;

    for (const chunk of chunks) {
      const translated = await translateSinglePart(chunk, apiBase);
      if (translated) {
        translatedChunks.push(translated);
        anyTranslated = true;
      } else {
        translatedChunks.push(chunk);
      }
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    return {
      text: translatedChunks.join(' '),
      translated: anyTranslated,
    };
  } catch {
    return { text, translated: false };
  }
};

export const translateBatch = async (
  texts: string[],
  apiBase = import.meta.env.PUBLIC_API_BASE_URL || ''
): Promise<TranslateResult[]> => {
  const results: TranslateResult[] = [];
  for (const text of texts) {
    results.push(await translateToSpanish(text, apiBase));
    if (texts.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  return results;
};

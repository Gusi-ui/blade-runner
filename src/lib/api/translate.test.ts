import { afterEach, describe, expect, it, vi } from 'vitest';
import { translateBatch, translateToSpanish } from './translate';

afterEach(() => vi.unstubAllGlobals());

describe('translateBatch', () => {
  it('traduce todos los textos en una sola petición', async () => {
    const fetchMock = vi.fn(async () => Response.json({ translations: ['hola', '', 'mundo'] }));
    vi.stubGlobal('fetch', fetchMock);
    const results = await translateBatch(['hello', '', 'world'], 'https://api.test');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      { text: 'hola', translated: true },
      { text: '', translated: false },
      { text: 'mundo', translated: true },
    ]);
  });

  it('parte los lotes de más de 20 textos', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const { texts } = JSON.parse(init.body as string) as { texts: string[] };
      return Response.json({ translations: texts });
    });
    vi.stubGlobal('fetch', fetchMock);
    const results = await translateBatch(Array(25).fill('x'), 'https://api.test');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(25);
  });

  it('devuelve los originales si la API falla', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 }))
    );
    expect(await translateToSpanish('hello', 'https://api.test')).toEqual({
      text: 'hello',
      translated: false,
    });
  });

  it('sin API no hace peticiones', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await translateBatch(['hello'], '')).toEqual([{ text: 'hello', translated: false }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

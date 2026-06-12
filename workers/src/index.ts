export interface Env {
  CACHE: KVNamespace;
  AI: Ai;
  NASA_API_KEY: string;
  GUARDIAN_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

interface APODData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  date: string;
  media_type: string;
  copyright?: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: { name: string };
}

const CHAT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const CHAT_MAX_TOKENS = 768;
const CHAT_MAX_HISTORY = 10;
const CHAT_MAX_MESSAGE_CHARS = 2000;

const SYSTEM_PROMPT = `Eres el asistente de la terminal Nexus-7 de Gusi, un desarrollador Full Stack español.
Responde SIEMPRE en español, con tono profesional y estética retro-futurista de Blade Runner.
Sé conciso (máximo 3 párrafos cortos) y responde en texto plano: tus respuestas se imprimen
en una terminal, así que nada de markdown, tablas ni bloques de código salvo que te pidan código.

COMANDOS DE LA TERMINAL (sugiérelos cuando ayuden):
menu, news/noticias [ai|cosmos], cv/curriculum, projects/proyectos, games/juegos,
calculator/calculadora, apod, ask/pregunta, chat, help/ayuda, contacto, status, config.

PERFIL DE GUSI:
- Desarrollador Full Stack especializado en JavaScript, TypeScript, Astro, React y Vue
- Apasionado por interfaces retro-futuristas y experiencias web únicas
- Email: webmaster@gusi.dev | GitHub: https://github.com/Gusi-ui | Web: https://gusi.dev

PROYECTOS DESTACADOS:
- Blade Runner Terminal: esta terminal interactiva cyberpunk hecha con Astro y Cloudflare Workers
- Portfolio profesional con métricas y proyectos de desarrollo web
- Dashboard Analytics, gestión de citas médicas, CMS headless, API developer portal

REGLAS:
- No inventes emails, teléfonos ni URLs que no estén en este contexto
- Si no sabes algo del portfolio, dilo y sugiere un comando de la terminal
- No des consejos médicos, legales ni financieros`;

const corsHeaders = (origin: string, allowedOrigin: string) => ({
  'Access-Control-Allow-Origin':
    origin === allowedOrigin || allowedOrigin === '*' ? origin : allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

const jsonResponse = (data: unknown, origin: string, env: Env, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, env.ALLOWED_ORIGIN || 'https://gusi.dev'),
    },
  });

const hashKey = async (text: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
};

const getCached = async <T>(cache: KVNamespace, key: string): Promise<T | null> => {
  const raw = await cache.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const setCached = async (cache: KVNamespace, key: string, data: unknown, ttl: number) => {
  await cache.put(key, JSON.stringify(data), { expirationTtl: ttl });
};

const fetchAPOD = async (env: Env, date?: string, random?: boolean): Promise<APODData> => {
  const nasaKey = env.NASA_API_KEY || 'DEMO_KEY';
  let url = `https://api.nasa.gov/planetary/apod?api_key=${nasaKey}`;

  if (random) {
    const start = new Date('1995-06-16').getTime();
    const end = Date.now();
    const randomDate = new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
    url += `&date=${randomDate}`;
  } else if (date) {
    url += `&date=${date}`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`NASA APOD: ${response.status}`);
  return response.json();
};

const fetchGuardianNews = async (env: Env): Promise<NewsArticle[]> => {
  const key = env.GUARDIAN_API_KEY || 'test';
  const topics = ['technology', 'science'];
  const articles: NewsArticle[] = [];

  for (const topic of topics) {
    const url = `https://content.guardianapis.com/search?section=${topic}&show-fields=headline,trailText&page-size=5&api-key=${key}`;
    const response = await fetch(url);
    if (!response.ok) continue;
    const data = (await response.json()) as {
      response?: {
        results?: Array<{
          webTitle: string;
          webUrl: string;
          webPublicationDate: string;
          fields?: { headline?: string; trailText?: string };
        }>;
      };
    };
    for (const item of data.response?.results || []) {
      articles.push({
        title: item.fields?.headline || item.webTitle,
        description: item.fields?.trailText || `Artículo de The Guardian sobre ${topic}`,
        url: item.webUrl,
        publishedAt: item.webPublicationDate,
        source: { name: 'The Guardian' },
      });
    }
  }
  return articles;
};

const fetchArXivNews = async (): Promise<NewsArticle[]> => {
  const url =
    'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:astro-ph&start=0&max_results=4&sortBy=submittedDate&sortOrder=descending';
  const response = await fetch(url);
  if (!response.ok) return [];

  const text = await response.text();
  const entries = [...text.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  const articles: NewsArticle[] = [];

  for (const [, entry] of entries) {
    const title =
      entry
        .match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/\s+/g, ' ')
        .trim() || '';
    const summary =
      entry
        .match(/<summary>([\s\S]*?)<\/summary>/)?.[1]
        ?.replace(/\s+/g, ' ')
        .trim() || '';
    const link = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || '';
    const published =
      entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || new Date().toISOString();
    if (title) {
      articles.push({
        title,
        description: summary.substring(0, 250) + (summary.length > 250 ? '...' : ''),
        url: link,
        publishedAt: published,
        source: { name: 'arXiv' },
      });
    }
  }
  return articles;
};

const filterNews = (articles: NewsArticle[], filter: string): NewsArticle[] => {
  if (filter === 'all') return articles;
  const aiKw = ['ai', 'artificial', 'machine learning', 'computer', 'software', 'tech'];
  const cosmosKw = ['space', 'nasa', 'cosmos', 'galaxy', 'planet', 'astronomy', 'star'];
  const kw = filter === 'ai' ? aiKw : cosmosKw;
  const filtered = articles.filter(a =>
    kw.some(k => `${a.title} ${a.description}`.toLowerCase().includes(k))
  );
  return filtered.length > 0 ? filtered : articles;
};

const translateText = async (text: string): Promise<string> => {
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text.slice(0, 4500))}`
  );
  if (!response.ok) return text;
  const data = (await response.json()) as unknown;
  const segments = Array.isArray(data) ? data[0] : null;
  if (Array.isArray(segments)) {
    return segments.map((item: string[]) => item[0]).join('');
  }
  return text;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || env.ALLOWED_ORIGIN || 'https://gusi.dev';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(origin, env.ALLOWED_ORIGIN || 'https://gusi.dev'),
      });
    }

    try {
      if (url.pathname === '/api/health') {
        return jsonResponse(
          { ok: true, endpoints: { apod: true, news: true, translate: true, chat: true } },
          origin,
          env
        );
      }

      if (url.pathname === '/api/apod' && request.method === 'GET') {
        const date = url.searchParams.get('date') || undefined;
        const random = url.searchParams.get('random') === 'true';
        const cacheKey = `apod:${random ? 'random' : date || 'today'}`;
        const cached = await getCached<APODData>(env.CACHE, cacheKey);
        if (cached) return jsonResponse(cached, origin, env);

        const data = await fetchAPOD(env, date, random);
        await setCached(env.CACHE, cacheKey, data, 21600);
        return jsonResponse(data, origin, env);
      }

      if (url.pathname === '/api/news' && request.method === 'GET') {
        const filter = url.searchParams.get('filter') || 'all';
        const cacheKey = `news:${filter}`;
        const cached = await getCached<{ articles: NewsArticle[] }>(env.CACHE, cacheKey);
        if (cached) return jsonResponse(cached, origin, env);

        const [guardian, arxiv] = await Promise.allSettled([
          fetchGuardianNews(env),
          fetchArXivNews(),
        ]);
        const all: NewsArticle[] = [];
        if (guardian.status === 'fulfilled') all.push(...guardian.value);
        if (arxiv.status === 'fulfilled') all.push(...arxiv.value);

        const unique = all.filter((a, i, self) => i === self.findIndex(x => x.title === a.title));
        const articles = filterNews(unique, filter).slice(0, 15);
        const result = { articles };
        await setCached(env.CACHE, cacheKey, result, 900);
        return jsonResponse(result, origin, env);
      }

      if (url.pathname === '/api/translate' && request.method === 'POST') {
        const body = (await request.json()) as { text?: string };
        const text = body.text || '';
        if (!text) return jsonResponse({ translatedText: '' }, origin, env);

        const cacheKey = `tr:${await hashKey(text)}`;
        const cached = await getCached<{ translatedText: string }>(env.CACHE, cacheKey);
        if (cached) return jsonResponse(cached, origin, env);

        const translatedText = await translateText(text);
        const result = { translatedText };
        await setCached(env.CACHE, cacheKey, result, 604800);
        return jsonResponse(result, origin, env);
      }

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const body = (await request.json()) as {
          message?: string;
          history?: { role: string; content: string }[];
          stream?: boolean;
        };
        const message = body.message?.trim().slice(0, CHAT_MAX_MESSAGE_CHARS);
        if (!message) return jsonResponse({ error: 'Mensaje vacío' }, origin, env, 400);

        const history = (body.history || []).slice(-CHAT_MAX_HISTORY);
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ];

        try {
          if (body.stream) {
            const stream = (await env.AI.run(CHAT_MODEL, {
              messages,
              max_tokens: CHAT_MAX_TOKENS,
              stream: true,
            })) as ReadableStream;

            return new Response(stream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                ...corsHeaders(origin, env.ALLOWED_ORIGIN || 'https://gusi.dev'),
              },
            });
          }

          const result = await env.AI.run(CHAT_MODEL, {
            messages,
            max_tokens: CHAT_MAX_TOKENS,
          });

          const text =
            typeof result === 'object' && result !== null && 'response' in result
              ? String((result as { response: string }).response)
              : String(result);

          return jsonResponse({ response: text }, origin, env);
        } catch {
          return jsonResponse(
            {
              response:
                'El asistente no está disponible temporalmente. Prueba los comandos: help, cv, projects, apod.',
            },
            origin,
            env
          );
        }
      }

      return jsonResponse({ error: 'Not found' }, origin, env, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      return jsonResponse({ error: message }, origin, env, 500);
    }
  },
};

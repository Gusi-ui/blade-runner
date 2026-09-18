/** Binding send_email (Cloudflare Email Sending, API por objeto). */
interface EmailSendBinding {
  send(message: {
    to: string | string[];
    from: { email: string; name?: string } | string;
    replyTo?: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<{ messageId?: string }>;
}

export interface Env {
  CACHE: KVNamespace;
  AI: Ai;
  NASA_API_KEY: string;
  GUARDIAN_API_KEY: string;
  ALLOWED_ORIGIN: string;
  // Email Sending (binding send_email). Requiere onboarding del dominio en Cloudflare.
  EMAIL: EmailSendBinding;
  CONTACT_TO: string; // buzón destino del formulario de contacto
  // Rate Limiting bindings (opcionales: si no existen, no se limita).
  CHAT_LIMITER?: RateLimit;
  TRANSLATE_LIMITER?: RateLimit;
  CONTACT_LIMITER?: RateLimit;
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
const TRANSLATE_MAX_CHARS = 5000;
const TRANSLATE_MODEL = CHAT_MODEL;
const TRANSLATE_MAX_BATCH = 20;
// Versión en la clave: invalida traducciones antiguas (m2m100) guardadas en KV.
const TRANSLATE_CACHE_PREFIX = 'tr2:';
const TRANSLATE_TTL = 2592000; // 30 días
const NEWS_FILTERS = new Set(['all', 'ai', 'cosmos']);
const APOD_FIRST_DATE = '1995-06-16';

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/** Fecha APOD válida: YYYY-MM-DD real, entre el primer APOD y hoy (UTC). */
const isValidApodDate = (date: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  return date >= APOD_FIRST_DATE && date <= new Date().toISOString().slice(0, 10);
};

/** Solo enlaces http(s): los feeds externos podrían traer javascript: u otros esquemas. */
const safeLink = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
};

const readJson = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'JSON inválido');
  }
};

/** Aplica el binding de rate limit por IP. Devuelve true si la petición debe rechazarse. */
const isRateLimited = async (
  limiter: RateLimit | undefined,
  request: Request
): Promise<boolean> => {
  if (!limiter) return false;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const { success } = await limiter.limit({ key: ip });
  return !success;
};

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

// localhost siempre permitido (dev); en producción solo el origen configurado.
const isAllowedOrigin = (origin: string, allowedOrigin: string): boolean =>
  allowedOrigin === '*' ||
  origin === allowedOrigin ||
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const corsHeaders = (origin: string, allowedOrigin: string) => ({
  'Access-Control-Allow-Origin': isAllowedOrigin(origin, allowedOrigin) ? origin : allowedOrigin,
  Vary: 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
});

const jsonResponse = (data: unknown, origin: string, env: Env, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, env.ALLOWED_ORIGIN || 'https://gusi.dev'),
    },
  });

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
        url: safeLink(item.webUrl),
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
        url: safeLink(link),
        publishedAt: published,
        source: { name: 'arXiv' },
      });
    }
  }
  return articles;
};

const decodeXmlEntities = (text: string): string =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .trim();

const fetchNasaRSS = async (): Promise<NewsArticle[]> => {
  const response = await fetch('https://www.nasa.gov/rss/dyn/breaking_news.rss');
  if (!response.ok) return [];

  const text = await response.text();
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  const articles: NewsArticle[] = [];

  for (const [, item] of items.slice(0, 5)) {
    const title = decodeXmlEntities(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
    const description = decodeXmlEntities(
      item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || ''
    );
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    if (title) {
      articles.push({
        title,
        description: description.substring(0, 250),
        url: safeLink(link),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: { name: 'NASA' },
      });
    }
  }
  return articles;
};

const fetchHackerNews = async (): Promise<NewsArticle[]> => {
  const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  if (!response.ok) return [];

  const ids = ((await response.json()) as number[]).slice(0, 6);
  const items = await Promise.allSettled(
    ids.map(async id => {
      const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if (!res.ok) throw new Error(`HN item ${id}`);
      return res.json() as Promise<{
        title?: string;
        url?: string;
        time?: number;
        score?: number;
        id: number;
      }>;
    })
  );

  const articles: NewsArticle[] = [];
  for (const item of items) {
    if (item.status !== 'fulfilled' || !item.value?.title) continue;
    const story = item.value;
    articles.push({
      title: story.title as string,
      description: `Tech: ${story.score ?? 0} puntos en Hacker News`,
      url: safeLink(story.url || `https://news.ycombinator.com/item?id=${story.id}`),
      publishedAt: story.time
        ? new Date(story.time * 1000).toISOString()
        : new Date().toISOString(),
      source: { name: 'Hacker News' },
    });
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

const TRANSLATE_PROMPT = `Eres un traductor profesional de inglés a español de España.
Traduce el texto del usuario de forma natural y fiel.
- NO traduzcas nombres propios, marcas, productos, proyectos de software, versiones ni siglas
  (p. ej. "Jemalloc 5.4.0", "Qwen", "Hacker News", "SpaceX", "x86" se quedan igual).
- Conserva números, fechas y URLs.
- Si el texto ya está en español o no tiene nada que traducir, devuélvelo tal cual.
Responde SOLO con la traducción, sin comillas, notas ni explicaciones.`;

// Traductor de respaldo (rápido pero de baja calidad) si el LLM falla.
const translateWithM2M = async (env: Env, text: string): Promise<string> => {
  const result = (await env.AI.run('@cf/meta/m2m100-1.2b', {
    text,
    source_lang: 'english',
    target_lang: 'spanish',
  })) as { translated_text?: string };
  return result.translated_text || text;
};

/**
 * Traduce con el LLM de Workers AI. Antes se usaba el endpoint no oficial de
 * Google (bloquea las peticiones desde Cloudflare) y caía siempre a m2m100,
 * que traducía hasta los nombres propios ("Jemalloc 5.4.0" → "Página 5.4.0").
 */
const translateText = async (env: Env, text: string): Promise<string> => {
  try {
    const result = (await env.AI.run(TRANSLATE_MODEL, {
      messages: [
        { role: 'system', content: TRANSLATE_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: Math.min(2048, Math.ceil(text.length / 2) + 64),
      temperature: 0.2,
    })) as { response?: string };
    const translated = result.response?.trim().replace(/^"([\s\S]*)"$/, '$1');
    // Descarta respuestas vacías o desproporcionadas (el modelo se puso a explicar).
    if (translated && translated.length < text.length * 3 + 40) return translated;
    throw new Error('Traducción LLM no válida');
  } catch {
    try {
      return await translateWithM2M(env, text);
    } catch {
      return text;
    }
  }
};

/** Traduce con caché en KV (por texto). */
const translateCached = async (env: Env, text: string): Promise<string> => {
  const cacheKey = `${TRANSLATE_CACHE_PREFIX}${await hashKey(text)}`;
  const cached = await getCached<{ translatedText: string }>(env.CACHE, cacheKey);
  if (cached) return cached.translatedText;
  const translatedText = await translateText(env, text);
  await setCached(env.CACHE, cacheKey, { translatedText }, TRANSLATE_TTL);
  return translatedText;
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
        if (date && !isValidApodDate(date)) {
          return jsonResponse({ error: 'Fecha inválida (YYYY-MM-DD)' }, origin, env, 400);
        }
        const random = url.searchParams.get('random') === 'true';

        // 'random' no se cachea por su clave (devolvería siempre la misma imagen
        // durante el TTL); se cachea por la fecha resuelta que devuelve la NASA.
        if (!random) {
          const cacheKey = `apod:${date || 'today'}`;
          const cached = await getCached<APODData>(env.CACHE, cacheKey);
          if (cached) return jsonResponse(cached, origin, env);

          const data = await fetchAPOD(env, date);
          await setCached(env.CACHE, cacheKey, data, 21600);
          return jsonResponse(data, origin, env);
        }

        const data = await fetchAPOD(env, undefined, true);
        if (data.date) {
          await setCached(env.CACHE, `apod:${data.date}`, data, 21600);
        }
        return jsonResponse(data, origin, env);
      }

      if (url.pathname === '/api/news' && request.method === 'GET') {
        const filterParam = url.searchParams.get('filter') || 'all';
        const filter = NEWS_FILTERS.has(filterParam) ? filterParam : 'all';
        const pageParam = url.searchParams.get('page');
        const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : null;
        const PAGE_SIZE = 10;

        const paginate = (articles: NewsArticle[]): { articles: NewsArticle[] } =>
          page
            ? { articles: articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) }
            : { articles };

        const cacheKey = `news:${filter}`;
        const cached = await getCached<{ articles: NewsArticle[] }>(env.CACHE, cacheKey);
        if (cached) return jsonResponse(paginate(cached.articles), origin, env);

        const [guardian, arxiv, nasa, hackerNews] = await Promise.allSettled([
          fetchGuardianNews(env),
          fetchArXivNews(),
          fetchNasaRSS(),
          fetchHackerNews(),
        ]);
        const all: NewsArticle[] = [];
        if (guardian.status === 'fulfilled') all.push(...guardian.value);
        if (arxiv.status === 'fulfilled') all.push(...arxiv.value);
        if (nasa.status === 'fulfilled') all.push(...nasa.value);
        if (hackerNews.status === 'fulfilled') all.push(...hackerNews.value);

        const unique = all.filter((a, i, self) => i === self.findIndex(x => x.title === a.title));
        const articles = filterNews(unique, filter)
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
          .slice(0, 20);
        const result = { articles };
        await setCached(env.CACHE, cacheKey, result, 900);
        return jsonResponse(paginate(articles), origin, env);
      }

      // Acepta { text } → { translatedText } o, por lotes, { texts } → { translations }.
      if (url.pathname === '/api/translate' && request.method === 'POST') {
        const body = await readJson<{ text?: unknown; texts?: unknown }>(request);
        const clip = (value: unknown) =>
          typeof value === 'string' ? value.slice(0, TRANSLATE_MAX_CHARS) : '';
        const batch = Array.isArray(body.texts);
        const texts = batch ? (body.texts as unknown[]).map(clip) : [clip(body.text)];
        if (texts.length > TRANSLATE_MAX_BATCH) {
          return jsonResponse(
            { error: `Máximo ${TRANSLATE_MAX_BATCH} textos por petición` },
            origin,
            env,
            400
          );
        }

        if (await isRateLimited(env.TRANSLATE_LIMITER, request)) {
          return jsonResponse({ error: 'Demasiadas peticiones' }, origin, env, 429);
        }
        const translations = await Promise.all(
          texts.map(text => (text.trim() ? translateCached(env, text) : text))
        );
        return jsonResponse(
          batch ? { translations } : { translatedText: translations[0] },
          origin,
          env
        );
      }

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const body = await readJson<{
          message?: unknown;
          history?: unknown;
          stream?: boolean;
        }>(request);
        const message =
          typeof body.message === 'string'
            ? body.message.trim().slice(0, CHAT_MAX_MESSAGE_CHARS)
            : '';
        if (!message) return jsonResponse({ error: 'Mensaje vacío' }, origin, env, 400);

        if (await isRateLimited(env.CHAT_LIMITER, request)) {
          return jsonResponse(
            { error: 'Demasiadas peticiones. Espera un momento.' },
            origin,
            env,
            429
          );
        }

        // Solo turnos user/assistant: el cliente nunca puede inyectar mensajes 'system'.
        const history = (Array.isArray(body.history) ? body.history : [])
          .filter(
            (h): h is { role: 'user' | 'assistant'; content: string } =>
              typeof h === 'object' &&
              h !== null &&
              (h.role === 'user' || h.role === 'assistant') &&
              typeof h.content === 'string'
          )
          .slice(-CHAT_MAX_HISTORY);
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map(h => ({
            role: h.role,
            content: h.content.slice(0, CHAT_MAX_MESSAGE_CHARS),
          })),
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

      if (url.pathname === '/api/contact' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          name?: string;
          email?: string;
          message?: string;
          website?: string; // honeypot anti-bots
        };

        // Honeypot: los bots rellenan el campo oculto 'website'. Fingimos éxito.
        if (body.website) return jsonResponse({ ok: true }, origin, env);

        const str = (v: unknown, max: number) =>
          typeof v === 'string' ? v.trim().slice(0, max) : '';
        // Sin saltos de línea en nombre/email: acaban en cabeceras (Subject, Reply-To).
        const name = str(body.name, 100).replace(/[\r\n]+/g, ' ');
        const email = str(body.email, 200);
        const message = str(body.message, 2000);
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!name || !emailOk || message.length < 5) {
          return jsonResponse(
            { ok: false, error: 'Revisa el nombre, el email y el mensaje (mínimo 5 caracteres).' },
            origin,
            env,
            400
          );
        }

        if (await isRateLimited(env.CONTACT_LIMITER, request)) {
          return jsonResponse(
            { ok: false, error: 'Has enviado demasiados mensajes. Inténtalo más tarde.' },
            origin,
            env,
            429
          );
        }

        // Rate limit por IP: 3 mensajes/hora (KV, complementa al binding por minuto).
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rlKey = `contact:${await hashKey(ip)}`;
        const count = (await getCached<number>(env.CACHE, rlKey)) || 0;
        if (count >= 3) {
          return jsonResponse(
            { ok: false, error: 'Has enviado demasiados mensajes. Inténtalo más tarde.' },
            origin,
            env,
            429
          );
        }

        try {
          await env.EMAIL.send({
            to: env.CONTACT_TO || 'webmaster@gusi.dev',
            from: { email: 'contacto@gusi.dev', name: 'Contacto gusi.dev' },
            replyTo: email,
            subject: `[gusi.dev] Mensaje de ${name}`,
            text: `De: ${name} <${email}>\n\n${message}`,
            html: `<p><strong>De:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
          });
        } catch (err) {
          const code = (err as { code?: string })?.code || '';
          const friendly =
            code === 'E_SENDER_NOT_VERIFIED' || code === 'E_SENDER_DOMAIN_NOT_AVAILABLE'
              ? 'El envío de email aún no está configurado en el servidor.'
              : 'No se pudo enviar el mensaje. Inténtalo más tarde.';
          return jsonResponse({ ok: false, error: friendly }, origin, env, 502);
        }

        await setCached(env.CACHE, rlKey, count + 1, 3600);
        return jsonResponse({ ok: true }, origin, env);
      }

      return jsonResponse({ error: 'Not found' }, origin, env, 404);
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse({ error: error.message }, origin, env, error.status);
      }
      // No exponer detalles internos al cliente; quedan en los logs del Worker.
      console.error('Unhandled error', url.pathname, error);
      return jsonResponse({ error: 'Error interno' }, origin, env, 500);
    }
  },
};

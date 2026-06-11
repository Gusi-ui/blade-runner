const getApiBase = (): string => import.meta.env.PUBLIC_API_BASE_URL || '';

export interface APODData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  date: string;
  media_type: string;
  copyright?: string;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: { name: string };
}

export const fetchAPOD = async (options?: {
  date?: string;
  random?: boolean;
}): Promise<APODData> => {
  const apiBase = getApiBase();
  const params = new URLSearchParams();
  if (options?.date) params.set('date', options.date);
  if (options?.random) params.set('random', 'true');

  if (apiBase) {
    const response = await fetch(`${apiBase}/api/apod?${params}`);
    if (!response.ok) throw new Error(`APOD API error: ${response.status}`);
    return response.json();
  }

  const nasaKey = import.meta.env.PUBLIC_NASA_API_KEY || 'DEMO_KEY';
  let url = `https://api.nasa.gov/planetary/apod?api_key=${nasaKey}`;
  if (options?.date) url += `&date=${options.date}`;
  if (options?.random) {
    const start = new Date('1995-06-16').getTime();
    const end = Date.now();
    const randomDate = new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
    url += `&date=${randomDate}`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`NASA APOD error: ${response.status}`);
  return response.json();
};

export const fetchNews = async (
  filter: 'all' | 'ai' | 'cosmos' = 'all'
): Promise<NewsArticle[]> => {
  const apiBase = getApiBase();
  if (apiBase) {
    const response = await fetch(`${apiBase}/api/news?filter=${filter}`);
    if (!response.ok) throw new Error(`News API error: ${response.status}`);
    const data = (await response.json()) as { articles?: NewsArticle[] };
    return data.articles || [];
  }

  const { fetchNewsFallback } = await import('./news-fallback');
  return fetchNewsFallback(filter);
};

export const sendChatMessage = async (
  message: string,
  history: { role: string; content: string }[] = []
): Promise<Response> => {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error('Chat requiere PUBLIC_API_BASE_URL configurada');

  return fetch(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
};

export const checkApiHealth = async (): Promise<{
  ok: boolean;
  endpoints: Record<string, boolean>;
}> => {
  const apiBase = getApiBase();
  if (!apiBase) {
    return { ok: false, endpoints: { worker: false } };
  }

  try {
    const response = await fetch(`${apiBase}/api/health`);
    if (!response.ok) return { ok: false, endpoints: { worker: false } };
    return response.json();
  } catch {
    return { ok: false, endpoints: { worker: false } };
  }
};

import type { NewsArticle } from './client';

const guardianKey = import.meta.env.PUBLIC_GUARDIAN_API_KEY || 'test';

const fetchFromGuardian = async (): Promise<NewsArticle[]> => {
  try {
    const topics = ['technology', 'science'];
    const articles: NewsArticle[] = [];

    for (const topic of topics) {
      const url = `https://content.guardianapis.com/search?section=${topic}&show-fields=headline,trailText&page-size=5&api-key=${guardianKey}`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (data.response?.results) {
        for (const item of data.response.results) {
          articles.push({
            title: item.fields?.headline || item.webTitle,
            description: item.fields?.trailText || `Artículo de The Guardian sobre ${topic}`,
            url: item.webUrl,
            publishedAt: item.webPublicationDate,
            source: { name: 'The Guardian' },
          });
        }
      }
    }
    return articles.slice(0, 8);
  } catch {
    return [];
  }
};

const fetchFromArXiv = async (): Promise<NewsArticle[]> => {
  try {
    const url =
      'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:astro-ph&start=0&max_results=4&sortBy=submittedDate&sortOrder=descending';
    const response = await fetch(url);
    if (!response.ok) return [];

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    const papers: NewsArticle[] = [];

    entries.forEach(entry => {
      const title = entry.querySelector('title')?.textContent?.trim() || '';
      const summary = entry.querySelector('summary')?.textContent?.trim() || '';
      const link = entry.querySelector('id')?.textContent?.trim() || '';
      const published =
        entry.querySelector('published')?.textContent?.trim() || new Date().toISOString();
      if (title) {
        papers.push({
          title,
          description: summary.substring(0, 250) + (summary.length > 250 ? '...' : ''),
          url: link,
          publishedAt: published,
          source: { name: 'arXiv' },
        });
      }
    });
    return papers;
  } catch {
    return [];
  }
};

const filterArticles = (
  articles: NewsArticle[],
  filter: 'all' | 'ai' | 'cosmos'
): NewsArticle[] => {
  if (filter === 'all') return articles;

  const aiKeywords = ['ia', 'ai', 'artificial', 'machine learning', 'computer', 'software', 'tech'];
  const cosmosKeywords = [
    'space',
    'nasa',
    'cosmos',
    'galaxy',
    'planet',
    'astronomy',
    'star',
    'universe',
  ];

  const keywords = filter === 'ai' ? aiKeywords : cosmosKeywords;

  return articles.filter(article => {
    const haystack = `${article.title} ${article.description}`.toLowerCase();
    return keywords.some(k => haystack.includes(k));
  });
};

export const fetchNewsFallback = async (
  filter: 'all' | 'ai' | 'cosmos'
): Promise<NewsArticle[]> => {
  const [guardian, arxiv] = await Promise.allSettled([fetchFromGuardian(), fetchFromArXiv()]);
  const all: NewsArticle[] = [];

  if (guardian.status === 'fulfilled') all.push(...guardian.value);
  if (arxiv.status === 'fulfilled') all.push(...arxiv.value);

  const unique = all.filter(
    (article, index, self) => index === self.findIndex(a => a.title === article.title)
  );

  return filterArticles(unique, filter).length > 0
    ? filterArticles(unique, filter)
    : unique.slice(0, 10);
};

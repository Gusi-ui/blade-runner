import type { TechNewsEvent } from '../../data/techEvents';
import { fetchAPOD, type APODData } from '../api/client';

// Datos externos del día de nacimiento: foto de la NASA (APOD) y efemérides
// de Wikipedia. Si algo falla, se devuelve vacío/null y la vista usa respaldo.

const APOD_FIRST_DATE = '1995-06-16';
const WIKIPEDIA_TIMEOUT_MS = 6000;

export interface WikipediaPage {
  displaytitle?: string;
  description?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
}

export interface WikipediaEvent {
  year: number;
  text: string;
  pages?: WikipediaPage[];
}

/** APOD del día de nacimiento, o null si no existe (antes de 1995-06-16) o falla. */
export const fetchBirthDayApod = async (birthdate: string): Promise<APODData | null> => {
  if (birthdate < APOD_FIRST_DATE) return null;
  try {
    return await fetchAPOD({ date: birthdate });
  } catch {
    return null;
  }
};

/** Efemérides «tal día como hoy» de Wikipedia (en inglés). Lista vacía si falla. */
export const fetchOnThisDay = async (month: number, day: number): Promise<WikipediaEvent[]> => {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  // Tope de tiempo: si Wikipedia no responde, se usan las efemérides de respaldo.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WIKIPEDIA_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${mm}/${dd}`,
      { signal: controller.signal }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { selected?: WikipediaEvent[] };
    return data.selected ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};

const TECH_KEYWORDS = [
  'technology',
  'computer',
  'internet',
  'software',
  'nasa',
  'space',
  'satellite',
  'telescope',
  'astronomy',
  'planet',
  'rocket',
  'science',
  'physics',
  'chemistry',
  'discovery',
  'invention',
  'engineer',
  'electronics',
  'digital',
  'innovation',
  'launched',
  'patent',
  'mathematician',
  'physicist',
  'chemist',
  'scientist',
  'astronomer',
  'galaxy',
  'universe',
  'cosmic',
  'artificial intelligence',
  'robot',
  'aviation',
  'aircraft',
  'flight',
];

const isTech = (text: string): boolean => {
  const lower = text.toLowerCase();
  return TECH_KEYWORDS.some(k => lower.includes(k));
};

/** Hasta 3 eventos de ciencia/tecnología a ±5 años del nacimiento. */
export const filterTechEvents = (events: WikipediaEvent[], birthYear: number): TechNewsEvent[] =>
  events
    .filter(e => Math.abs(e.year - birthYear) <= 5)
    .filter(
      e =>
        isTech(e.text ?? '') ||
        (e.pages ?? []).some(p => isTech(`${p.displaytitle ?? ''} ${p.description ?? ''}`))
    )
    .slice(0, 3)
    .map(e => {
      const page = e.pages?.[0];
      return {
        title: `${e.year}: ${e.text}`,
        description:
          page?.extract ||
          page?.description ||
          'Evento significativo en la historia de la tecnología y la ciencia.',
        source: 'Wikipedia',
        url: page?.content_urls?.desktop?.page,
      };
    });

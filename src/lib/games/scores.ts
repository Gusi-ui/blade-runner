// Puntuaciones persistentes de los juegos: top-5 por juego con fecha,
// en una única clave de localStorage ('nexus-scores').

export type GameId = 'snake' | 'tetris' | 'hangman' | 'guess';

export interface ScoreEntry {
  score: number;
  date: string; // ISO
}

export const GAME_LABELS: Record<GameId, string> = {
  snake: 'Snake',
  tetris: 'Tetris',
  hangman: 'Ahorcado (racha)',
  guess: 'Adivina el número',
};

const STORAGE_KEY = 'nexus-scores';
const LEGACY_SNAKE_KEY = 'snake-high-score';
const TOP_N = 5;

type ScoreMap = Partial<Record<GameId, ScoreEntry[]>>;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const defaultStorage = (): StorageLike | null =>
  typeof localStorage === 'undefined' ? null : localStorage;

const load = (storage: StorageLike | null): ScoreMap => {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ScoreMap) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const save = (storage: StorageLike | null, scores: ScoreMap): void => {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // almacenamiento lleno o deshabilitado
  }
};

/** Migra el récord antiguo de snake ('snake-high-score') al formato nuevo. */
const migrateLegacy = (storage: StorageLike | null, scores: ScoreMap): ScoreMap => {
  try {
    const legacy = storage?.getItem(LEGACY_SNAKE_KEY);
    if (legacy && !scores.snake) {
      const score = parseInt(legacy, 10);
      if (score > 0) {
        scores.snake = [{ score, date: new Date().toISOString() }];
        save(storage, scores);
      }
      storage?.removeItem(LEGACY_SNAKE_KEY);
    }
  } catch {
    // sin almacenamiento disponible
  }
  return scores;
};

/**
 * Registra una puntuación. Devuelve true si es un nuevo récord del juego.
 */
export const saveScore = (
  game: GameId,
  score: number,
  storage: StorageLike | null = defaultStorage()
): boolean => {
  if (score <= 0) return false;
  const scores = migrateLegacy(storage, load(storage));
  const entries = scores[game] ?? [];
  const isRecord = entries.length === 0 || score > entries[0].score;
  entries.push({ score, date: new Date().toISOString() });
  entries.sort((a, b) => b.score - a.score);
  scores[game] = entries.slice(0, TOP_N);
  save(storage, scores);
  return isRecord;
};

export const getHighScore = (
  game: GameId,
  storage: StorageLike | null = defaultStorage()
): number => {
  const scores = migrateLegacy(storage, load(storage));
  return scores[game]?.[0]?.score ?? 0;
};

export const getLeaderboard = (
  storage: StorageLike | null = defaultStorage()
): { game: GameId; label: string; entries: ScoreEntry[] }[] => {
  const scores = migrateLegacy(storage, load(storage));
  return (Object.keys(GAME_LABELS) as GameId[])
    .filter(game => (scores[game]?.length ?? 0) > 0)
    .map(game => ({ game, label: GAME_LABELS[game], entries: scores[game] ?? [] }));
};

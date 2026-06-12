import { beforeEach, describe, expect, it } from 'vitest';
import { getHighScore, getLeaderboard, saveScore } from './scores';

const makeStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

describe('scores', () => {
  let storage: ReturnType<typeof makeStorage>;

  beforeEach(() => {
    storage = makeStorage();
  });

  it('guarda puntuaciones y detecta récords', () => {
    expect(saveScore('snake', 50, storage)).toBe(true);
    expect(saveScore('snake', 30, storage)).toBe(false);
    expect(saveScore('snake', 80, storage)).toBe(true);
    expect(getHighScore('snake', storage)).toBe(80);
  });

  it('mantiene solo el top-5 por juego, ordenado descendente', () => {
    for (const score of [10, 20, 30, 40, 50, 60, 70]) {
      saveScore('tetris', score, storage);
    }
    const board = getLeaderboard(storage);
    const tetris = board.find(b => b.game === 'tetris');
    expect(tetris?.entries.map(e => e.score)).toEqual([70, 60, 50, 40, 30]);
  });

  it('ignora puntuaciones no positivas', () => {
    expect(saveScore('guess', 0, storage)).toBe(false);
    expect(getLeaderboard(storage)).toEqual([]);
  });

  it('migra el récord antiguo de snake', () => {
    storage.setItem('snake-high-score', '120');
    expect(getHighScore('snake', storage)).toBe(120);
    expect(storage.getItem('snake-high-score')).toBeNull();
    // La migración no machaca puntuaciones nuevas posteriores
    saveScore('snake', 200, storage);
    expect(getHighScore('snake', storage)).toBe(200);
  });

  it('el leaderboard solo incluye juegos con puntuaciones', () => {
    saveScore('hangman', 3, storage);
    const board = getLeaderboard(storage);
    expect(board).toHaveLength(1);
    expect(board[0].label).toContain('Ahorcado');
  });
});

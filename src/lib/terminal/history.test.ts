import { beforeEach, describe, expect, it } from 'vitest';
import { CommandHistory } from './history';

const makeStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

describe('CommandHistory', () => {
  let storage: ReturnType<typeof makeStorage>;

  beforeEach(() => {
    storage = makeStorage();
  });

  it('añade comandos y navega hacia atrás y adelante', () => {
    const history = new CommandHistory(storage);
    history.add('help');
    history.add('news');
    expect(history.prev()).toBe('news');
    expect(history.prev()).toBe('help');
    expect(history.prev()).toBeNull();
    expect(history.next()).toBe('news');
    expect(history.next()).toBe('');
    expect(history.next()).toBeNull();
  });

  it('ignora duplicados consecutivos y entradas vacías', () => {
    const history = new CommandHistory(storage);
    history.add('help');
    history.add('help');
    history.add('   ');
    expect(history.list()).toEqual(['help']);
  });

  it('persiste y recarga desde el almacenamiento', () => {
    const history = new CommandHistory(storage);
    history.add('apod');
    history.add('news ai');
    const reloaded = new CommandHistory(storage);
    expect(reloaded.list()).toEqual(['apod', 'news ai']);
    expect(reloaded.prev()).toBe('news ai');
  });

  it('limita el historial a 100 entradas', () => {
    const history = new CommandHistory(storage);
    for (let i = 0; i < 120; i++) history.add(`cmd-${i}`);
    expect(history.list()).toHaveLength(100);
    expect(history.list()[0]).toBe('cmd-20');
  });

  it('clear vacía historial y almacenamiento', () => {
    const history = new CommandHistory(storage);
    history.add('help');
    history.clear();
    expect(history.list()).toEqual([]);
    expect(storage.getItem('nexus-history')).toBeNull();
  });

  it('funciona sin almacenamiento disponible', () => {
    const history = new CommandHistory(null);
    history.add('help');
    expect(history.prev()).toBe('help');
  });
});

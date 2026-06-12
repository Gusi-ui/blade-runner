import { describe, expect, it } from 'vitest';
import { buildCommands } from './commands';
import { getCompletions } from './completion';
import type { CommandHistory } from './history';
import { CommandRegistry } from './registry';

const registry = new CommandRegistry();
registry.registerAll(
  buildCommands({
    history: { list: () => [], clear: () => undefined } as unknown as CommandHistory,
  })
);
registry.register({
  name: 'matrix',
  description: 'oculto',
  hidden: true,
  handler: () => undefined,
});

describe('getCompletions', () => {
  it('completa nombres de comando por prefijo', () => {
    const { options } = getCompletions('not', registry);
    expect(options.map(o => o.value)).toContain('noticias');
  });

  it('calcula el prefijo común', () => {
    const { commonPrefix, options } = getCompletions('c', registry);
    expect(options.length).toBeGreaterThan(1);
    expect(commonPrefix).toBe('c');
  });

  it('completa argumentos con choices', () => {
    const { options } = getCompletions('news a', registry);
    expect(options.map(o => o.value)).toEqual(['news ai', 'news all']);
  });

  it('no sugiere comandos ocultos', () => {
    const { options } = getCompletions('mat', registry);
    expect(options).toEqual([]);
  });

  it('no completa argumentos de comandos sin choices', () => {
    expect(getCompletions('cv algo', registry).options).toEqual([]);
  });

  it('devuelve vacío para entrada vacía', () => {
    expect(getCompletions('', registry).options).toEqual([]);
    expect(getCompletions('   ', registry).options).toEqual([]);
  });
});

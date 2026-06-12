import { describe, expect, it } from 'vitest';
import { buildCommands } from './commands';
import type { CommandHistory } from './history';
import { parseInput } from './parser';
import { CommandRegistry } from './registry';

const makeRegistry = (): CommandRegistry => {
  const registry = new CommandRegistry();
  registry.registerAll(
    buildCommands({
      history: { list: () => [], clear: () => undefined } as unknown as CommandHistory,
    })
  );
  registry.register({
    name: 'ask',
    description: 'Pregunta a la IA',
    restOfLine: true,
    handler: () => undefined,
  });
  return registry;
};

const registry = makeRegistry();

describe('parseInput', () => {
  it('resuelve comandos simples sin argumentos', () => {
    expect(parseInput('help', registry)?.spec.name).toBe('help');
    expect(parseInput('  AYUDA  ', registry)?.spec.name).toBe('help');
  });

  it('preserva los alias multi-palabra', () => {
    expect(parseInput('imagen nasa', registry)?.spec.name).toBe('apod');
    expect(parseInput('proyectos debussy', registry)?.spec.name).toBe('projects');
    expect(parseInput('foto  nasa', registry)?.spec.name).toBe('apod');
  });

  it('preserva los atajos numéricos', () => {
    expect(parseInput('6', registry)?.spec.name).toBe('apod');
    expect(parseInput('8', registry)?.spec.name).toBe('chat');
    expect(parseInput('7', registry)?.spec.name).toBe('exit');
  });

  it('separa comando y argumentos', () => {
    const parsed = parseInput('news AI', registry);
    expect(parsed?.spec.name).toBe('news');
    expect(parsed?.args).toEqual(['ai']);
  });

  it('los comandos restOfLine reciben el resto como un único argumento con su caso original', () => {
    const parsed = parseInput('ask ¿Qué proyectos tiene Gusi?', registry);
    expect(parsed?.spec.name).toBe('ask');
    expect(parsed?.args).toEqual(['¿Qué proyectos tiene Gusi?']);
  });

  it('devuelve null para entradas vacías o desconocidas', () => {
    expect(parseInput('', registry)).toBeNull();
    expect(parseInput('   ', registry)).toBeNull();
    expect(parseInput('comando_inexistente', registry)).toBeNull();
    expect(parseInput('comando_inexistente con args', registry)).toBeNull();
  });
});

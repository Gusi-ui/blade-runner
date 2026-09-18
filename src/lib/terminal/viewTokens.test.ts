import { describe, expect, it } from 'vitest';
import { buildCommands } from './commands';
import type { CommandHistory } from './history';
import { CommandRegistry } from './registry';
import { VIEW_TOKENS } from './viewTokens';

describe('VIEW_TOKENS', () => {
  it('coincide con los tokens navegables del registro', () => {
    const registry = new CommandRegistry();
    registry.registerAll(
      buildCommands({
        history: { list: () => [], clear: () => undefined } as unknown as CommandHistory,
      })
    );
    const navigable = registry
      .specs()
      .filter(s => s.view)
      .flatMap(s => [s.name, ...(s.aliases ?? [])])
      .filter(t => /^[\p{L}-]+$/u.test(t))
      .map(t => t.toLowerCase())
      .sort();
    expect([...VIEW_TOKENS].sort()).toEqual(navigable);
  });
});

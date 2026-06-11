import { describe, expect, it } from 'vitest';
import { getCommandSuggestions, resolveCommand } from './commands';

describe('resolveCommand', () => {
  it('resolves Spanish aliases', () => {
    expect(resolveCommand('ayuda')?.type).toBe('help');
    expect(resolveCommand('noticias')?.type).toBe('view');
    expect(resolveCommand('salir')?.type).toBe('exit');
    expect(resolveCommand('calculadora')?.view).toBe('calculator');
  });

  it('resolves numeric shortcuts', () => {
    expect(resolveCommand('6')?.view).toBe('apod');
    expect(resolveCommand('8')?.view).toBe('chat');
  });

  it('returns null for unknown commands', () => {
    expect(resolveCommand('comando_inexistente')).toBeNull();
  });
});

describe('getCommandSuggestions', () => {
  it('suggests matching commands', () => {
    const suggestions = getCommandSuggestions('not');
    expect(suggestions).toContain('noticias');
  });
});

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
    expect(resolveCommand('7')?.type).toBe('exit');
  });

  it('resolves multi-word aliases', () => {
    expect(resolveCommand('imagen nasa')?.view).toBe('apod');
    expect(resolveCommand('proyectos debussy')?.view).toBe('projects');
  });

  it('resolves menu and simple commands', () => {
    expect(resolveCommand('menu')).toEqual({ type: 'view', view: 'menu' });
    expect(resolveCommand('cls')?.type).toBe('clear');
    expect(resolveCommand('contacto')?.type).toBe('contact');
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

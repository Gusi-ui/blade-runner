import { describe, expect, it } from 'vitest';
import { buildCommands, getCommandSuggestions, resolveCommand } from './commands';
import type { CommandHistory } from './history';
import { CommandRegistry, type TerminalContext } from './registry';

const makeCtx = () => {
  const calls = {
    printText: [] as string[],
    print: [] as string[],
    loadView: [] as { view: string; args?: string[] }[],
  };
  const registry = new CommandRegistry();
  registry.registerAll(
    buildCommands({
      history: { list: () => [], clear: () => undefined } as unknown as CommandHistory,
    })
  );
  const ctx: TerminalContext = {
    print: html => void calls.print.push(html),
    printText: text => void calls.printText.push(text),
    printBlock: () => ({}) as HTMLElement,
    clear: () => undefined,
    loadView: (view, args) => void calls.loadView.push({ view, args }),
    setInputDisabled: () => undefined,
    scrollToBottom: () => undefined,
    registry,
  };
  return { ctx, calls, registry };
};

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

describe('comando edad', () => {
  it('sin argumentos abre la vista de la calculadora', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('edad')?.handler([], ctx);
    expect(calls.loadView).toEqual([{ view: 'calculator', args: undefined }]);
  });

  it('con fecha válida imprime la tabla de edades planetarias', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('edad')?.handler(['1990-05-12'], ctx);
    expect(calls.print).toHaveLength(1);
    expect(calls.print[0]).toContain('Mercurio');
    expect(calls.print[0]).toContain('Neptuno');
  });

  it('rechaza fechas inválidas o futuras con mensaje de uso', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('edad')?.handler(['ayer'], ctx);
    registry.resolveToken('edad')?.handler(['2999-01-01'], ctx);
    expect(calls.printText).toHaveLength(2);
    expect(calls.printText[0]).toContain('Uso: edad');
    expect(calls.print).toHaveLength(0);
  });
});

describe('comando apod con argumentos', () => {
  it('sin args o con "hoy" carga la vista sin argumentos', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('apod')?.handler([], ctx);
    registry.resolveToken('apod')?.handler(['hoy'], ctx);
    expect(calls.loadView).toEqual([
      { view: 'apod', args: undefined },
      { view: 'apod', args: undefined },
    ]);
  });

  it('pasa random y fechas válidas a la vista', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('apod')?.handler(['random'], ctx);
    registry.resolveToken('apod')?.handler(['2020-01-01'], ctx);
    expect(calls.loadView).toEqual([
      { view: 'apod', args: ['random'] },
      { view: 'apod', args: ['2020-01-01'] },
    ]);
  });

  it('rechaza fechas fuera de rango o malformadas', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('apod')?.handler(['1990-01-01'], ctx);
    registry.resolveToken('apod')?.handler(['12/05/1990'], ctx);
    expect(calls.loadView).toHaveLength(0);
    expect(calls.printText).toHaveLength(2);
  });
});

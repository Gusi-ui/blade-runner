import { describe, expect, it } from 'vitest';
import { buildCommands } from './commands';
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
    printTyped: () => Promise.resolve(),
    clear: () => undefined,
    loadView: (view, args) => void calls.loadView.push({ view, args }),
    setInputDisabled: () => undefined,
    scrollToBottom: () => undefined,
    pushInputHandler: () => undefined,
    popInputHandler: () => undefined,
    registry,
  };
  return { ctx, calls, registry };
};

describe('resolución de comandos', () => {
  const name = (token: string) => makeCtx().registry.resolveToken(token)?.name;

  it('alias en español', () => {
    expect(name('ayuda')).toBe('help');
    expect(name('noticias')).toBe('news');
    expect(name('salir')).toBe('exit');
    expect(name('calculadora')).toBe('calculator');
  });

  it('atajos numéricos', () => {
    expect(name('6')).toBe('apod');
    expect(name('8')).toBe('chat');
    expect(name('7')).toBe('exit');
    expect(name('2')).toBe('sobre-mi');
    expect(name('3')).toBe('proyectos');
  });

  it('alias de varias palabras', () => {
    expect(name('imagen nasa')).toBe('apod');
  });

  it('menu es un alias de help y cv/about lo son de sobre-mi', () => {
    expect(name('menu')).toBe('help');
    expect(name('m')).toBe('help');
    expect(name('cv')).toBe('sobre-mi');
    expect(name('about')).toBe('sobre-mi');
    expect(name('projects')).toBe('proyectos');
    expect(name('contact')).toBe('contacto');
  });

  it('desconocido → undefined', () => {
    expect(name('comando_inexistente')).toBeUndefined();
  });
});

describe('comandos de contenido', () => {
  it('proyectos imprime las 4 webs reales', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('proyectos')?.handler([], ctx);
    const html = calls.print.join('');
    for (const site of ['viandalucia.org', 'divermataro.org', 'irenepuigdemont.com', 'alamia.es']) {
      expect(html).toContain(site);
    }
  });

  it('sobre-mi imprime la presentación y las tarifas', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('sobre-mi')?.handler([], ctx);
    const html = calls.print.join('');
    expect(html).toContain('Hola, soy Gusi');
    expect(html).toContain('250 €');
    expect(html).toContain('A medida');
  });

  it('proyectos, sobre-mi y contacto están en Destacados', () => {
    const { registry } = makeCtx();
    for (const cmd of ['proyectos', 'sobre-mi', 'contacto']) {
      expect(registry.resolveToken(cmd)?.group).toBe('featured');
    }
  });

  it('help separa Destacados y Laboratorio', () => {
    const { ctx, calls, registry } = makeCtx();
    registry.resolveToken('help')?.handler([], ctx);
    const html = calls.print.join('');
    expect(html).toContain('Destacados');
    expect(html).toContain('Laboratorio');
    expect(html.indexOf('proyectos')).toBeLessThan(html.indexOf('Laboratorio'));
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

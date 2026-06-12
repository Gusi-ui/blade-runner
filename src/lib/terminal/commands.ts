import { askInline } from '../ai/ask';
import { CONTACT_HTML } from '../ai/chatContext';
import { checkApiHealth } from '../api/client';
import { showConfig } from './configMenu';
import type { CommandHistory } from './history';
import { CommandRegistry } from './registry';
import type { CommandSpec, TerminalContext } from './registry';
import { escapeHtml } from './sanitize';

export type ViewName =
  | 'news'
  | 'cv'
  | 'projects'
  | 'games'
  | 'calculator'
  | 'apod'
  | 'chat'
  | 'menu'
  | 'exit';

const viewHandler =
  (view: ViewName) =>
  (args: string[], ctx: TerminalContext): void => {
    ctx.loadView(view, args);
  };

const showHelp = (ctx: TerminalContext): void => {
  const rows = ctx.registry
    .visibleSpecs()
    .map(spec => {
      const aliases = (spec.aliases ?? []).filter(a => /^\p{L}/u.test(a)).join(', ');
      return `
        <div class="contents">
          <span class="text-terminal-bright">${escapeHtml(spec.usage ?? spec.name)}</span>
          <span>${escapeHtml(spec.description)}${aliases ? ` <span class="text-terminal-dim">(${escapeHtml(aliases)})</span>` : ''}</span>
        </div>`;
    })
    .join('');
  ctx.print(`
    <div class="text-terminal-bright">COMANDOS DISPONIBLES (ES/EN):</div>
    <div class="ml-4 mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">${rows}</div>
    <div class="mt-3 text-sm text-terminal-dim">Atajos numéricos: 1=noticias, 2=cv, 3=proyectos, 4=juegos, 5=calculadora, 6=apod, 7=salir, 8=chat. Usa Tab para autocompletar.</div>
  `);
};

const showStatus = async (ctx: TerminalContext): Promise<void> => {
  const health = await checkApiHealth();
  const apiBase = import.meta.env.PUBLIC_API_BASE_URL || 'no configurada';
  ctx.print(`
    <div class="section-title">Estado del Sistema</div>
    <div class="border border-terminal-dim p-4 rounded space-y-1 text-sm">
      <div><span class="text-terminal-bright">Terminal:</span> ONLINE</div>
      <div><span class="text-terminal-bright">API Worker:</span> ${health.ok ? 'OK' : 'OFFLINE'}</div>
      <div><span class="text-terminal-bright">API Base:</span> ${escapeHtml(apiBase)}</div>
      <div><span class="text-terminal-bright">Versión:</span> 2.0.0</div>
    </div>
  `);
};

const showMenu = (ctx: TerminalContext): void => {
  ctx.print(`
 <div class="section-title">
   Menú Principal - Nexus Terminal v1.0
 </div>
 <div id="menu-container"></div>
  `);
  document.dispatchEvent(new CustomEvent('loadMenu'));
};

const handleExit = (ctx: TerminalContext): void => {
  ctx.printText('Cerrando sesión...');
  setTimeout(() => {
    ctx.clear();
    ctx.printText('Adiós, humano.');
    ctx.setInputDisabled(true);
  }, 1000);
};

export interface CommandDeps {
  history: CommandHistory;
}

export const buildCommands = (deps: CommandDeps): CommandSpec[] => [
  {
    name: 'help',
    aliases: ['ayuda', '?'],
    description: 'Muestra esta lista de comandos',
    handler: (_args, ctx) => showHelp(ctx),
  },
  {
    name: 'menu',
    aliases: ['m'],
    description: 'Menú principal',
    handler: (_args, ctx) => showMenu(ctx),
  },
  {
    name: 'news',
    aliases: ['1', 'noticias'],
    description: 'Noticias de tecnología y cosmos',
    usage: 'news [ai|cosmos|all]',
    choices: ['ai', 'cosmos', 'all'],
    view: 'news',
    handler: viewHandler('news'),
  },
  {
    name: 'cv',
    aliases: ['2', 'resume', 'curriculum'],
    description: 'Currículum de Gusi',
    view: 'cv',
    handler: viewHandler('cv'),
  },
  {
    name: 'projects',
    aliases: ['3', 'proyectos', 'proyectos debussy'],
    description: 'Portfolio de proyectos',
    view: 'projects',
    handler: viewHandler('projects'),
  },
  {
    name: 'games',
    aliases: ['4', 'juegos'],
    description: 'Juegos retro (Snake, Tetris, Ahorcado, Tres en Raya)',
    view: 'games',
    handler: viewHandler('games'),
  },
  {
    name: 'calculator',
    aliases: ['5', 'calculadora'],
    description: 'Calculadora cósmica: edad planetaria y datos NASA',
    view: 'calculator',
    handler: viewHandler('calculator'),
  },
  {
    name: 'apod',
    aliases: ['6', 'imagen nasa', 'foto nasa'],
    description: 'Imagen astronómica del día (NASA)',
    view: 'apod',
    handler: viewHandler('apod'),
  },
  {
    name: 'chat',
    aliases: ['8'],
    description: 'Asistente IA Nexus-7 (vista de conversación)',
    view: 'chat',
    handler: viewHandler('chat'),
  },
  {
    name: 'ask',
    aliases: ['pregunta'],
    description: 'Pregunta a la IA sin salir de la terminal',
    usage: 'ask <pregunta>',
    restOfLine: true,
    handler: (args, ctx) => (args.length === 0 ? ctx.loadView('chat') : askInline(args[0], ctx)),
  },
  {
    name: 'clear',
    aliases: ['limpiar', 'cls'],
    description: 'Limpia la pantalla',
    handler: (_args, ctx) => ctx.clear(),
  },
  {
    name: 'date',
    aliases: ['fecha'],
    description: 'Fecha y hora actual',
    handler: (_args, ctx) => ctx.printText(`Fecha actual: ${new Date().toLocaleString('es-ES')}`),
  },
  {
    name: 'whoami',
    description: 'Identidad del usuario',
    handler: (_args, ctx) => ctx.printText('gusi@nexus'),
  },
  {
    name: 'history',
    aliases: ['historial'],
    description: 'Historial de comandos',
    usage: 'history [-c]',
    handler: (args, ctx) => {
      if (args[0] === '-c') {
        deps.history.clear();
        ctx.print('<div class="success-text">Historial borrado.</div>');
        return;
      }
      const entries = deps.history.list();
      if (entries.length === 0) {
        ctx.printText('El historial está vacío.');
        return;
      }
      const rows = entries
        .map(
          (entry, i) =>
            `<div><span class="text-terminal-dim">${String(i + 1).padStart(3)}</span>  ${escapeHtml(entry)}</div>`
        )
        .join('');
      ctx.print(`<div class="text-sm whitespace-pre">${rows}</div>`);
    },
  },
  {
    name: 'config',
    aliases: ['configuracion'],
    description: 'Configuración (tema, efectos, sonido)',
    handler: (_args, ctx) => showConfig(ctx),
  },
  {
    name: 'status',
    aliases: ['estado'],
    description: 'Estado del sistema y la API',
    handler: (_args, ctx) => showStatus(ctx),
  },
  {
    name: 'contact',
    aliases: ['contacto'],
    description: 'Información de contacto',
    handler: (_args, ctx) => ctx.print(CONTACT_HTML),
  },
  {
    name: 'exit',
    aliases: ['7', 'salir', 'quit'],
    description: 'Cierra la sesión',
    handler: (_args, ctx) => handleExit(ctx),
  },
];

// ---------------------------------------------------------------------------
// API legada, conservada por compatibilidad mientras dura la transición.

export interface CommandAction {
  type:
    | 'view'
    | 'help'
    | 'clear'
    | 'date'
    | 'whoami'
    | 'config'
    | 'status'
    | 'contact'
    | 'history'
    | 'exit';
  view?: ViewName;
}

const SIMPLE_TYPES = new Set([
  'help',
  'clear',
  'date',
  'whoami',
  'config',
  'status',
  'contact',
  'history',
  'exit',
]);

const buildDefaultRegistry = (): CommandRegistry => {
  const registry = new CommandRegistry();
  // El historial solo lo necesita el comando 'history'; un stub sin storage basta aquí.
  registry.registerAll(
    buildCommands({
      history: {
        list: () => [],
        clear: () => undefined,
      } as unknown as CommandHistory,
    })
  );
  return registry;
};

const defaultRegistry = buildDefaultRegistry();

export const resolveCommand = (input: string): CommandAction | null => {
  const spec = defaultRegistry.resolveToken(input.toLowerCase().trim());
  if (!spec) return null;
  if (SIMPLE_TYPES.has(spec.name)) return { type: spec.name as CommandAction['type'] };
  if (spec.name === 'menu') return { type: 'view', view: 'menu' };
  if (spec.name === 'ask') return { type: 'view', view: 'chat' };
  if (spec.view) return { type: 'view', view: spec.view as ViewName };
  return null;
};

export const ALL_COMMANDS = defaultRegistry.visibleTokens();

export const getCommandSuggestions = (partial: string): string[] => {
  const p = partial.toLowerCase().trim();
  if (!p) return [];
  return ALL_COMMANDS.filter(cmd => cmd.startsWith(p)).slice(0, 6);
};

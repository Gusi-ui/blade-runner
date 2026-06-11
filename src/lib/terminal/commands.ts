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

export interface CommandAction {
  type: 'view' | 'help' | 'clear' | 'date' | 'whoami' | 'config' | 'status' | 'contact' | 'exit';
  view?: ViewName;
}

const viewCommands: Record<string, ViewName> = {
  '1': 'news',
  news: 'news',
  noticias: 'news',
  '2': 'cv',
  cv: 'cv',
  resume: 'cv',
  curriculum: 'cv',
  '3': 'projects',
  projects: 'projects',
  proyectos: 'projects',
  'proyectos debussy': 'projects',
  '4': 'games',
  games: 'games',
  juegos: 'games',
  '5': 'calculator',
  calculator: 'calculator',
  calculadora: 'calculator',
  '6': 'apod',
  apod: 'apod',
  'imagen nasa': 'apod',
  'foto nasa': 'apod',
  '8': 'chat',
  chat: 'chat',
  ask: 'chat',
  pregunta: 'chat',
  '7': 'exit',
};

export const COMMAND_ALIASES: Record<string, CommandAction> = {
  help: { type: 'help' },
  ayuda: { type: 'help' },
  '?': { type: 'help' },
  menu: { type: 'view', view: 'menu' },
  m: { type: 'view', view: 'menu' },
  clear: { type: 'clear' },
  limpiar: { type: 'clear' },
  cls: { type: 'clear' },
  date: { type: 'date' },
  fecha: { type: 'date' },
  whoami: { type: 'whoami' },
  config: { type: 'config' },
  configuracion: { type: 'config' },
  status: { type: 'status' },
  estado: { type: 'status' },
  contact: { type: 'contact' },
  contacto: { type: 'contact' },
  exit: { type: 'exit' },
  salir: { type: 'exit' },
  quit: { type: 'exit' },
};

export const ALL_COMMANDS = [
  'help',
  'ayuda',
  'menu',
  'clear',
  'limpiar',
  'date',
  'fecha',
  'news',
  'noticias',
  'cv',
  'curriculum',
  'projects',
  'proyectos',
  'games',
  'juegos',
  'calculator',
  'calculadora',
  'apod',
  'chat',
  'pregunta',
  'config',
  'status',
  'contacto',
  'exit',
  'salir',
];

export const resolveCommand = (input: string): CommandAction | null => {
  const normalized = input.toLowerCase().trim();
  if (!normalized) return null;

  if (COMMAND_ALIASES[normalized]) return COMMAND_ALIASES[normalized];

  const view = viewCommands[normalized];
  if (view === 'exit') return { type: 'exit' };
  if (view) return { type: 'view', view };

  return null;
};

export const getCommandSuggestions = (partial: string): string[] => {
  const p = partial.toLowerCase().trim();
  if (!p) return [];
  return ALL_COMMANDS.filter(cmd => cmd.startsWith(p)).slice(0, 6);
};

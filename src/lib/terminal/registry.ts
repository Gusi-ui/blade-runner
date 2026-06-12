// Registro declarativo de comandos de la terminal.
// Los handlers reciben un TerminalContext en lugar de tocar el controlador,
// de modo que el catálogo es testeable sin DOM.

export interface TerminalContext {
  /** Imprime HTML confiable (generado por la app, nunca input del usuario). */
  print(html: string): void;
  /** Imprime texto plano escapado (seguro para input del usuario). */
  printText(text: string): void;
  /** Crea y añade un bloque de salida vacío, para contenido incremental (streaming). */
  printBlock(): HTMLElement;
  clear(): void;
  loadView(view: string, args?: string[]): void;
  setInputDisabled(disabled: boolean): void;
  scrollToBottom(): void;
  registry: CommandRegistry;
}

export interface CommandSpec {
  /** Nombre canónico del comando ('apod'). */
  name: string;
  /** Alias ES/EN, atajos numéricos y alias multi-palabra ('imagen nasa'). */
  aliases?: string[];
  description: string;
  /** Sintaxis mostrada en help y errores de uso: 'apod [YYYY-MM-DD | random]'. */
  usage?: string;
  /** Valores completables del primer argumento (Tab). */
  choices?: string[];
  /** El resto de la línea es un único argumento (p. ej. 'ask <pregunta>'). */
  restOfLine?: boolean;
  /** No aparece en help ni en el autocompletado (easter eggs). */
  hidden?: boolean;
  /** Comandos de navegación: vista que cargan vía CustomEvent('loadView'). */
  view?: string;
  handler: (args: string[], ctx: TerminalContext) => void | Promise<void>;
}

const isCompletableToken = (token: string): boolean => token.length > 1 && /^\p{L}+$/u.test(token);

export class CommandRegistry {
  private byToken = new Map<string, CommandSpec>();
  private all: CommandSpec[] = [];

  register(spec: CommandSpec): void {
    this.all.push(spec);
    for (const token of [spec.name, ...(spec.aliases ?? [])]) {
      this.byToken.set(token.toLowerCase(), spec);
    }
  }

  registerAll(specs: CommandSpec[]): void {
    specs.forEach(spec => this.register(spec));
  }

  resolveToken(token: string): CommandSpec | undefined {
    return this.byToken.get(token.toLowerCase().trim());
  }

  specs(): CommandSpec[] {
    return [...this.all];
  }

  visibleSpecs(): CommandSpec[] {
    return this.all.filter(spec => !spec.hidden);
  }

  /** Tokens de una sola palabra que participan en help y autocompletado. */
  visibleTokens(): string[] {
    const tokens = new Set<string>();
    for (const spec of this.visibleSpecs()) {
      for (const token of [spec.name, ...(spec.aliases ?? [])]) {
        if (isCompletableToken(token)) tokens.add(token);
      }
    }
    return [...tokens].sort();
  }
}

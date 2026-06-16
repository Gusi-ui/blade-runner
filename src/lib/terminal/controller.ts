import { cancelAsk } from '../ai/ask';
import { playKeySound } from '../audio/keySounds';
import { buildCommands } from './commands';
import { getCompletions } from './completion';
import { buildEasterEggCommands, installKonamiListener } from './easterEggs';
import { CommandHistory } from './history';
import { parseInput } from './parser';
import { CommandRegistry, type InputInterceptor, type TerminalContext } from './registry';
import { escapeHtml } from './sanitize';
import { typeText } from './typewriter';

const PROMPT = 'gusi@nexus:~$';
const MAX_HINT_OPTIONS = 6;

export class TerminalController {
  private input: HTMLInputElement;
  private outputContainer: HTMLElement;
  private mirrorText: HTMLElement | null;
  private hint: HTMLElement | null;
  private history = new CommandHistory();
  private registry = new CommandRegistry();
  private interceptors: InputInterceptor[] = [];
  private ctx: TerminalContext;
  /** Vista activa reflejada en location.hash (deep links). Evita bucles de hashchange. */
  private currentView = '';

  constructor() {
    this.input = document.getElementById('terminal-input') as HTMLInputElement;
    this.outputContainer = document.getElementById('output-container') as HTMLElement;
    this.mirrorText = document.getElementById('mirror-text');
    this.hint = document.getElementById('completion-hint');

    this.ctx = {
      print: html => this.printOutput(html),
      printText: text => this.printText(text),
      printBlock: () => this.printBlock(),
      printTyped: (text, charsPerSecond) => this.printTyped(text, charsPerSecond),
      clear: () => this.clear(),
      loadView: (view, args) => this.loadView(view, args),
      setInputDisabled: disabled => {
        this.input.disabled = disabled;
      },
      scrollToBottom: () => this.scrollToBottom(),
      pushInputHandler: interceptor => void this.interceptors.push(interceptor),
      popInputHandler: () => void this.interceptors.pop(),
      registry: this.registry,
    };

    this.registry.registerAll(buildCommands({ history: this.history }));
    this.registry.registerAll(buildEasterEggCommands());
    installKonamiListener();

    this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.input.addEventListener('input', () => {
      this.syncMirror();
      this.updateHint();
    });

    const sendBtn = document.getElementById('terminal-send');
    sendBtn?.addEventListener('click', () => this.submitCommand());

    document.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (cmd) {
          this.input.value = cmd;
          this.submitCommand();
        }
      });
    });

    // Deep links: #cv, #projects, #news… cargan la vista al entrar y con
    // back/forward. La navegación inicial se difiere para que los listeners
    // de los componentes (loadView) ya estén montados.
    window.addEventListener('hashchange', () => this.navigateToHash());
    setTimeout(() => this.navigateToHash(), 0);

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    // En móvil no auto-enfocamos al cargar (evita que salte el teclado solo),
    // pero SÍ al tocar la pantalla (abajo) para poder escribir sin apuntar al
    // cursor. En escritorio enfocamos directamente.
    if (!isMobile) this.input.focus();

    // Tocar/clicar cualquier parte del terminal enfoca el input, salvo en
    // elementos interactivos (botones, enlaces, otros campos). Funciona también
    // en móvil porque ocurre dentro del gesto del usuario.
    const focusInputFromTap = (e: Event): void => {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('#quick-actions')
      ) {
        return;
      }
      this.input.focus();
    };
    document.addEventListener('click', focusInputFromTap);
  }

  /**
   * El cursor de bloque se posiciona con un "espejo" del texto del input
   * (mismo ancho en fuente mono): solo hay que sincronizarlo cuando cambia
   * el valor, sin medir nada ni usar intervalos.
   */
  private syncMirror(): void {
    if (this.mirrorText) this.mirrorText.textContent = this.input.value;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // No procesar si hay un input de juego o de chat activo
    const activeElement = document.activeElement;
    if (
      activeElement &&
      activeElement !== this.input &&
      (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
    ) {
      return;
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Backspace')) {
      playKeySound('key');
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      this.clear();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      if (cancelAsk()) return; // primero cancela el streaming de IA si lo hay
      this.printOutput(
        `<span class="text-terminal-bright">${PROMPT}</span> ${escapeHtml(this.input.value)}^C`
      );
      this.input.value = '';
      this.syncMirror();
      // Después, el modo interactivo (juego textual) si está activo
      const interceptor = this.interceptors.pop();
      if (interceptor) interceptor.onCancel();
      this.history.resetNavigation();
      this.clearHint();
      this.scrollToBottom();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      this.input.value = '';
      this.syncMirror();
      this.clearHint();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      playKeySound('enter');
      this.submitCommand();
    } else if (e.key === 'Tab') {
      if (!this.input.value.trim() || this.interceptors.length > 0) return;
      e.preventDefault();
      this.handleTab();
    } else if (e.key === 'Escape') {
      this.clearHint();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const entry = this.history.prev();
      if (entry !== null) {
        this.input.value = entry;
        this.syncMirror();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const entry = this.history.next();
      if (entry !== null) {
        this.input.value = entry;
        this.syncMirror();
      }
    }
  }

  private handleTab(): void {
    const { options, commonPrefix } = getCompletions(this.input.value, this.registry);
    if (options.length === 0) return;

    if (options.length === 1) {
      this.input.value = options[0].value;
    } else if (commonPrefix.length > this.input.value.trimStart().toLowerCase().length) {
      this.input.value = commonPrefix;
    } else {
      // Sin progreso posible: listar opciones con su descripción (estilo bash)
      const rows = options
        .map(
          o =>
            `<div><span class="text-terminal-bright">${escapeHtml(o.value)}</span> <span class="text-terminal-dim">— ${escapeHtml(o.description)}</span></div>`
        )
        .join('');
      this.printOutput(`<div class="ml-4 text-sm">${rows}</div>`);
      this.scrollToBottom();
    }
    this.syncMirror();
    this.updateHint();
  }

  private updateHint(): void {
    if (!this.hint) return;
    if (this.interceptors.length > 0) {
      this.clearHint();
      return;
    }
    const { options } = getCompletions(this.input.value, this.registry);
    if (options.length === 0 || (options.length === 1 && options[0].value === this.input.value)) {
      this.clearHint();
      return;
    }
    this.hint.textContent = options
      .slice(0, MAX_HINT_OPTIONS)
      .map(o => o.value)
      .join('   ');
    this.hint.classList.remove('hidden');
  }

  private clearHint(): void {
    if (!this.hint) return;
    this.hint.textContent = '';
    this.hint.classList.add('hidden');
  }

  private submitCommand(): void {
    const command = this.input.value.trim();
    if (!command) return;
    this.input.value = '';
    this.clearHint();
    this.syncMirror();

    // Modo interactivo: la entrada va al interceptor, no al parser
    const interceptor = this.interceptors[this.interceptors.length - 1];
    if (interceptor) {
      this.printOutput(`<span class="text-terminal-dim">&gt;</span> ${escapeHtml(command)}`);
      interceptor.onInput(command);
      this.scrollToBottom();
      return;
    }

    this.history.add(command);
    void this.executeCommand(command);
  }

  private async executeCommand(command: string): Promise<void> {
    this.printOutput(`<span class="text-terminal-bright">${PROMPT}</span> ${escapeHtml(command)}`);
    // Referencia a la línea del comando para, al terminar, colocarla arriba.
    const promptLine = this.outputContainer.lastElementChild as HTMLElement | null;

    const parsed = parseInput(command, this.registry);

    if (!parsed) {
      this.printOutput(
        `<span class="error-text">Error: Comando '${escapeHtml(command)}' no reconocido. Escribe 'help' o 'ayuda'.</span>`
      );
      this.scrollCommandIntoView(promptLine);
      return;
    }

    try {
      await parsed.spec.handler(parsed.args, this.ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      this.printOutput(`<span class="error-text">Error: ${escapeHtml(message)}</span>`);
    }

    this.scrollCommandIntoView(promptLine);
  }

  /**
   * Tras ejecutar un comando, lleva su línea de prompt al inicio del viewport
   * para que la salida se lea desde arriba ("ver dónde estás"). Si no hay
   * referencia, cae al scroll al final.
   */
  private scrollCommandIntoView(promptLine: HTMLElement | null): void {
    if (promptLine) promptLine.scrollIntoView({ block: 'start' });
    else this.scrollToBottom();
  }

  private loadView(view: string, args: string[] = []): void {
    // Refleja la vista en el hash (compartible). Marcar currentView antes de
    // tocar el hash evita que el hashchange resultante re-ejecute el comando.
    this.currentView = view;
    if (location.hash.slice(1) !== view) location.hash = view;
    document.dispatchEvent(new CustomEvent('loadView', { detail: { view, args } }));
  }

  /** Ejecuta el comando navegable que corresponde al hash actual (#cv, #news…). */
  private navigateToHash(): void {
    const token = location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (!token || token === this.currentView) return;

    const spec = this.registry.resolveToken(token);
    if (!spec || (!spec.view && spec.name !== 'menu')) return; // solo vistas navegables

    this.input.value = '';
    this.clearHint();
    void this.executeCommand(spec.name);
  }

  private clear(): void {
    this.outputContainer.innerHTML = '';
  }

  printOutput(html: string): void {
    const div = document.createElement('div');
    div.className = 'terminal-output mb-2';
    div.innerHTML = html;
    this.outputContainer.appendChild(div);
  }

  printText(text: string): void {
    const div = document.createElement('div');
    div.className = 'terminal-output mb-2';
    div.textContent = text;
    this.outputContainer.appendChild(div);
  }

  printBlock(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'terminal-output mb-2';
    this.outputContainer.appendChild(div);
    return div;
  }

  async printTyped(text: string, charsPerSecond?: number): Promise<void> {
    const block = this.printBlock();
    block.classList.add('whitespace-pre-wrap');
    this.scrollToBottom();
    await typeText(block, text, { charsPerSecond });
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    // El contenedor scrollable es la ventana (.terminal-screen crece con su
    // contenido, no tiene overflow propio), así que hay que mover el scroll
    // del documento, no el del elemento.
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }
}

/** Reloj de la cabecera ("CONECTADO: ..."), actualizado cada segundo. */
export const startHeaderClock = (): void => {
  const update = (): void => {
    const datetimeEl = document.getElementById('terminal-datetime');
    if (datetimeEl) {
      datetimeEl.textContent = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
  };
  update();
  setInterval(update, 1000);
};

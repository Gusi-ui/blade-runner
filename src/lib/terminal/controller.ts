import { cancelAsk } from '../ai/ask';
import { buildCommands } from './commands';
import { getCompletions } from './completion';
import { CommandHistory } from './history';
import { parseInput } from './parser';
import { CommandRegistry, type InputInterceptor, type TerminalContext } from './registry';
import { escapeHtml } from './sanitize';

const PROMPT = 'gusi@nexus:~$';
const MAX_HINT_OPTIONS = 6;

export class TerminalController {
  private input: HTMLInputElement;
  private outputContainer: HTMLElement;
  private cursor: HTMLElement;
  private hint: HTMLElement | null;
  private history = new CommandHistory();
  private registry = new CommandRegistry();
  private interceptors: InputInterceptor[] = [];
  private ctx: TerminalContext;

  constructor() {
    this.input = document.getElementById('terminal-input') as HTMLInputElement;
    this.outputContainer = document.getElementById('output-container') as HTMLElement;
    this.cursor = document.querySelector('.terminal-cursor') as HTMLElement;
    this.hint = document.getElementById('completion-hint');

    this.ctx = {
      print: html => this.printOutput(html),
      printText: text => this.printText(text),
      printBlock: () => this.printBlock(),
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

    this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.input.addEventListener('input', () => {
      this.updateCursorPosition();
      this.updateHint();
    });
    this.input.addEventListener('click', () => this.updateCursorPosition());
    this.input.addEventListener('focus', () => this.updateCursorPosition());

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

    const headerToggle = document.getElementById('header-toggle');
    const asciiPanel = document.getElementById('ascii-header-panel');
    headerToggle?.addEventListener('click', () => {
      const expanded = headerToggle.getAttribute('aria-expanded') === 'true';
      headerToggle.setAttribute('aria-expanded', String(!expanded));
      asciiPanel?.classList.toggle('hidden');
      headerToggle.textContent = expanded ? '▸ NEXUS-7 Terminal' : '▾ NEXUS-7 Terminal';
    });

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    if (!isMobile) this.input.focus();

    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.closest('input') ||
        target.closest('button') ||
        target.closest('#quick-actions')
      ) {
        return;
      }
      if (!isMobile) this.input.focus();
    });

    // Inicializar posición del cursor después de que el DOM esté listo
    setTimeout(() => {
      this.updateCursorPosition();
    }, 100);

    // Actualizar posición del cursor periódicamente solo si el input del terminal está activo
    setInterval(() => {
      const activeElement = document.activeElement;
      if (
        activeElement === this.input &&
        !document.querySelector('input[id^="hangman-input"]:focus') &&
        !document.querySelector('input[id^="tictactoe-"]:focus')
      ) {
        this.updateCursorPosition();
      }
    }, 100);
  }

  private updateCursorPosition(): void {
    if (!this.cursor || !this.input) return;

    const prompt = document.querySelector('.terminal-prompt') as HTMLElement;
    if (!prompt) return;

    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.style.font = window.getComputedStyle(this.input).font;
    span.textContent = this.input.value || '';
    document.body.appendChild(span);

    const textWidth = span.offsetWidth;
    document.body.removeChild(span);

    const promptWidth = prompt.offsetWidth;
    const gapWidth = 8; // gap-2 = 0.5rem = 8px
    const cursorOffset = 3;
    this.cursor.style.left = `${promptWidth + gapWidth + textWidth + cursorOffset}px`;
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
      this.updateCursorPosition();
      this.clearHint();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
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
        this.updateCursorPosition();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const entry = this.history.next();
      if (entry !== null) {
        this.input.value = entry;
        this.updateCursorPosition();
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
    this.updateCursorPosition();
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
    this.updateCursorPosition();

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

    const parsed = parseInput(command, this.registry);

    if (!parsed) {
      this.printOutput(
        `<span class="error-text">Error: Comando '${escapeHtml(command)}' no reconocido. Escribe 'help' o 'ayuda'.</span>`
      );
      this.scrollToBottom();
      return;
    }

    try {
      await parsed.spec.handler(parsed.args, this.ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      this.printOutput(`<span class="error-text">Error: ${escapeHtml(message)}</span>`);
    }

    this.scrollToBottom();
  }

  private loadView(view: string, args: string[] = []): void {
    document.dispatchEvent(new CustomEvent('loadView', { detail: { view, args } }));
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

  private scrollToBottom(): void {
    const screen = document.querySelector('.terminal-screen');
    if (screen) {
      screen.scrollTop = screen.scrollHeight;
    }
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

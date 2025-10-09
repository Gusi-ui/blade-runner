// Hangman Game - Cosmic Theme
import type { TerminalController } from '../types/terminal';

export class Hangman {
  private words = [
    { word: 'NEBULOSA', hint: 'Nube interestelar de polvo y gas' },
    { word: 'GRAVEDAD', hint: 'Fuerza de atracción universal' },
    { word: 'GALAXIA', hint: 'Sistema de estrellas y planetas' },
    { word: 'METEORO', hint: 'Roca espacial que entra en la atmósfera' },
    { word: 'ASTRONAUTA', hint: 'Explorador del espacio' },
    { word: 'SATELITE', hint: 'Objeto que orbita un planeta' },
    { word: 'CONSTELACION', hint: 'Patrón de estrellas en el cielo' },
    { word: 'AGUJERO NEGRO', hint: 'Región del espacio con gravedad extrema' },
    { word: 'SUPERNOVA', hint: 'Explosión estelar' },
    { word: 'ASTEROIDE', hint: 'Roca espacial menor' },
  ];

  private currentWord = '';
  private currentHint = '';
  private guessedLetters: string[] = [];
  private wrongGuesses = 0;
  private maxWrongGuesses = 6;
  private terminal: TerminalController;

  constructor(terminal: TerminalController) {
    this.terminal = terminal;
    this.init();
  }

  private init(): void {
    this.selectWord();
    this.render();
    this.setupInput();
  }

  private selectWord(): void {
    const selected = this.words[Math.floor(Math.random() * this.words.length)];
    this.currentWord = selected.word.toUpperCase();
    this.currentHint = selected.hint;
    this.guessedLetters = [];
    this.wrongGuesses = 0;
  }

  private render(): void {
    const wordDisplay = this.getWordDisplay();
    const hangmanArt = this.getHangmanArt();

    this.terminal.printOutput(`
      <div class="text-terminal-bright mb-4">
        ═══════════════════════════════════════════════════════════
                      EL AHORCADO CÓSMICO
        ═══════════════════════════════════════════════════════════
      </div>
      <div class="mb-4">
        <div class="text-terminal-dim mb-2">Pista: ${this.currentHint}</div>
        <div class="hangman-art text-terminal-text mb-4"><pre>${hangmanArt}</pre></div>
        <div class="hangman-word-display text-2xl tracking-widest mb-4 text-center">${wordDisplay}</div>
        <div class="hangman-attempts text-sm text-terminal-dim mb-2">
          Intentos restantes: ${this.maxWrongGuesses - this.wrongGuesses}
        </div>
        <div class="hangman-letters text-sm mb-4">
          Letras usadas: ${this.guessedLetters.length > 0 ? this.guessedLetters.join(', ') : 'Ninguna'}
        </div>
      </div>
      <div id="hangman-input-container">
        <div class="mb-2 text-terminal-bright">Ingresa una letra:</div>
        <div class="flex gap-2 items-center">
          <div class="relative">
            <input
              type="text"
              id="hangman-input"
              class="terminal-input border-2 border-terminal-bright bg-transparent px-3 py-2 w-20 text-center text-lg font-bold text-terminal-bright focus:border-terminal-bright focus:outline-none"
              maxlength="1"
              autocomplete="off"
              placeholder="_"
            />
            <div class="hangman-cursor absolute right-1 top-1/2 transform -translate-y-1/2 text-terminal-bright animate-pulse">|</div>
          </div>
          <button id="hangman-submit" class="menu-item px-4 py-1">Enviar</button>
          <button id="hangman-exit" class="menu-item px-4 py-1">Salir</button>
        </div>
        <div class="mt-2 text-xs text-terminal-dim">El campo de entrada está delimitado con borde brillante</div>
      </div>
      <div id="hangman-message" class="mt-4"></div>
    `);

    setTimeout(() => {
      const input = document.getElementById('hangman-input') as HTMLInputElement;
      const cursor = document.querySelector('.hangman-cursor');
      const submitBtn = document.getElementById('hangman-submit');
      const exitBtn = document.getElementById('hangman-exit');

      if (input) {
        // Dar focus al input del juego
        input.focus();

        // Show cursor when focused
        input.addEventListener('focus', () => {
          if (cursor) cursor.classList.remove('opacity-0');
        });

        // Hide cursor when not focused
        input.addEventListener('blur', () => {
          if (cursor && !input.value) cursor.classList.add('opacity-0');
        });

        // Manejar teclas - prevenir que lleguen al terminal
        input.addEventListener('keydown', e => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            this.makeGuess();
          }
        });

        // Prevenir que eventos de teclas lleguen al terminal
        input.addEventListener('keypress', e => {
          e.stopPropagation();
        });

        input.addEventListener('keyup', e => {
          e.stopPropagation();
        });

        input.addEventListener('input', e => {
          e.stopPropagation();
          if (cursor) cursor.classList.add('opacity-0');
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener('click', () => this.makeGuess());
      }

      if (exitBtn) {
        exitBtn.addEventListener('click', () => this.exit());
      }
    }, 100);
  }

  private setupInput(): void {
    // El input se configura en render() después de inyectar el HTML
  }

  private getWordDisplay(): string {
    return this.currentWord
      .split('')
      .map(letter => {
        if (letter === ' ') return ' / ';
        return this.guessedLetters.includes(letter) ? letter : '_';
      })
      .join(' ');
  }

  private getHangmanArt(): string {
    const stages = [
      `
   ╔═══╗
   ║
   ║
   ║
   ║
  ═╩═══
      `,
      `
   ╔═══╗
   ║   O
   ║
   ║
   ║
  ═╩═══
      `,
      `
   ╔═══╗
   ║   O
   ║   |
   ║
   ║
  ═╩═══
      `,
      `
   ╔═══╗
   ║   O
   ║  /|
   ║
   ║
  ═╩═══
      `,
      `
   ╔═══╗
   ║   O
   ║  /|\\
   ║
   ║
  ═╩═══
      `,
      `
   ╔═══╗
   ║   O
   ║  /|\\
   ║  /
   ║
  ═╩═══
      `,
      `
   ╔═══╗
   ║   O
   ║  /|\\
   ║  / \\
   ║
  ═╩═══
      `,
    ];

    return stages[this.wrongGuesses];
  }

  private makeGuess(): void {
    const input = document.getElementById('hangman-input') as HTMLInputElement;
    const messageEl = document.getElementById('hangman-message');

    if (!input || !messageEl) return;

    const letter = input.value.toUpperCase().trim();
    input.value = '';

    if (!letter || letter.length !== 1) {
      messageEl.innerHTML = '<div class="error-text">Por favor ingresa una letra válida.</div>';
      return;
    }

    if (!/[A-Z]/.test(letter)) {
      messageEl.innerHTML = '<div class="error-text">Solo letras del alfabeto.</div>';
      return;
    }

    if (this.guessedLetters.includes(letter)) {
      messageEl.innerHTML = '<div class="text-terminal-dim">Ya usaste esa letra.</div>';
      return;
    }

    this.guessedLetters.push(letter);

    if (this.currentWord.includes(letter)) {
      messageEl.innerHTML = '<div class="success-text">¡Correcto!</div>';

      // Verificar si ganó
      if (this.checkWin()) {
        this.win();
        return;
      }
    } else {
      this.wrongGuesses++;
      messageEl.innerHTML = '<div class="error-text">Letra incorrecta.</div>';

      // Verificar si perdió
      if (this.wrongGuesses >= this.maxWrongGuesses) {
        this.lose();
        return;
      }
    }

    // Actualizar solo las partes necesarias en lugar de re-renderizar todo
    this.updateGameDisplay();
  }

  private updateGameDisplay(): void {
    const wordDisplayEl = document.querySelector('.hangman-word-display');
    const hangmanArtEl = document.querySelector('.hangman-art');
    const attemptsEl = document.querySelector('.hangman-attempts');
    const lettersEl = document.querySelector('.hangman-letters');

    if (wordDisplayEl) {
      wordDisplayEl.textContent = this.getWordDisplay();
    }

    if (hangmanArtEl) {
      hangmanArtEl.innerHTML = `<pre>${this.getHangmanArt()}</pre>`;
    }

    if (attemptsEl) {
      attemptsEl.textContent = (this.maxWrongGuesses - this.wrongGuesses).toString();
    }

    if (lettersEl) {
      lettersEl.textContent =
        this.guessedLetters.length > 0 ? this.guessedLetters.join(', ') : 'Ninguna';
    }
  }

  private checkWin(): boolean {
    return this.currentWord
      .split('')
      .every(letter => letter === ' ' || this.guessedLetters.includes(letter));
  }

  private win(): void {
    const messageEl = document.getElementById('hangman-message');
    if (messageEl) {
      messageEl.innerHTML = `
        <div class="text-terminal-bright text-center text-xl mt-4">
          ¡GANASTE!
        </div>
        <div class="text-center mt-2">La palabra era: ${this.currentWord}</div>
        <div class="text-center mt-4">
          <button id="hangman-play-again" class="menu-item inline-block px-4 py-2">Jugar de nuevo</button>
          <button id="hangman-exit2" class="menu-item inline-block px-4 py-2 ml-2">Salir</button>
        </div>
      `;

      setTimeout(() => {
        const playAgainBtn = document.getElementById('hangman-play-again');
        const exitBtn = document.getElementById('hangman-exit2');

        if (playAgainBtn) {
          playAgainBtn.addEventListener('click', () => {
            this.selectWord();
            this.render();
          });
        }

        if (exitBtn) {
          exitBtn.addEventListener('click', () => this.exit());
        }
      }, 100);
    }
  }

  private lose(): void {
    const messageEl = document.getElementById('hangman-message');
    if (messageEl) {
      messageEl.innerHTML = `
        <div class="error-text text-center text-xl mt-4">
          GAME OVER
        </div>
        <div class="text-center mt-2">La palabra era: ${this.currentWord}</div>
        <div class="text-center mt-4">
          <button id="hangman-play-again" class="menu-item inline-block px-4 py-2">Jugar de nuevo</button>
          <button id="hangman-exit2" class="menu-item inline-block px-4 py-2 ml-2">Salir</button>
        </div>
      `;

      setTimeout(() => {
        const playAgainBtn = document.getElementById('hangman-play-again');
        const exitBtn = document.getElementById('hangman-exit2');

        if (playAgainBtn) {
          playAgainBtn.addEventListener('click', () => {
            this.selectWord();
            this.render();
          });
        }

        if (exitBtn) {
          exitBtn.addEventListener('click', () => this.exit());
        }
      }, 100);
    }
  }

  private exit(): void {
    this.terminal.printOutput('<div class="success-text">Saliendo del juego...</div>');
    setTimeout(() => {
      const event = new CustomEvent('loadView', { detail: { view: 'games' } });
      document.dispatchEvent(event);
    }, 500);
  }
}

// Exportar globalmente
(window as Window).Hangman = Hangman;

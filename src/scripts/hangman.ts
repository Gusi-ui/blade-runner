// Hangman Game - Cosmic Theme
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
    { word: 'ASTEROIDE', hint: 'Roca espacial menor' }
  ];

  private currentWord = '';
  private currentHint = '';
  private guessedLetters: string[] = [];
  private wrongGuesses = 0;
  private maxWrongGuesses = 6;
  private terminal: any;

  constructor(terminal: any) {
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
        <pre class="text-terminal-text mb-4">${hangmanArt}</pre>
        <div class="text-2xl tracking-widest mb-4 text-center">${wordDisplay}</div>
        <div class="text-sm text-terminal-dim mb-2">
          Intentos restantes: ${this.maxWrongGuesses - this.wrongGuesses}
        </div>
        <div class="text-sm mb-4">
          Letras usadas: ${this.guessedLetters.length > 0 ? this.guessedLetters.join(', ') : 'Ninguna'}
        </div>
      </div>
      <div id="hangman-input-container">
        <div class="mb-2">Ingresa una letra:</div>
        <div class="flex gap-2">
          <input
            type="text"
            id="hangman-input"
            class="terminal-input border border-terminal-dim px-2 py-1 w-20"
            maxlength="1"
            autocomplete="off"
          />
          <button id="hangman-submit" class="menu-item px-4 py-1">Enviar</button>
          <button id="hangman-exit" class="menu-item px-4 py-1">Salir</button>
        </div>
      </div>
      <div id="hangman-message" class="mt-4"></div>
    `);

    setTimeout(() => {
      const input = document.getElementById('hangman-input') as HTMLInputElement;
      const submitBtn = document.getElementById('hangman-submit');
      const exitBtn = document.getElementById('hangman-exit');

      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.makeGuess();
          }
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
      `
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

    // Re-renderizar
    setTimeout(() => {
      this.render();
    }, 1000);
  }

  private checkWin(): boolean {
    return this.currentWord.split('').every(letter =>
      letter === ' ' || this.guessedLetters.includes(letter)
    );
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
(window as any).Hangman = Hangman;

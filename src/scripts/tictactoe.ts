// Tic Tac Toe Game with AI
import type { TerminalController } from '../types/terminal';

export class TicTacToe {
  private board: string[] = ['', '', '', '', '', '', '', '', ''];
  private currentPlayer = 'X';
  private gameOver = false;
  private terminal: TerminalController;

  constructor(terminal: TerminalController) {
    this.terminal = terminal;
    this.init();
  }

  private init(): void {
    this.render();
  }

  private render(): void {
    const boardHtml = this.getBoardHtml();

    this.terminal.printOutput(`
      <div class="text-terminal-bright mb-4">
        ═══════════════════════════════════════════════════════════
                         TRES EN RAYA
        ═══════════════════════════════════════════════════════════
      </div>
      <div class="mb-4 text-center">
        <div class="mb-2">Tú eres: <span class="text-terminal-bright">X</span></div>
        <div class="mb-4">IA es: <span class="text-terminal-bright">O</span></div>
      </div>
      <div class="flex justify-center mb-4">
        ${boardHtml}
      </div>
      <div id="tictactoe-message" class="text-center mb-4"></div>
      <div class="text-center">
        <button id="tictactoe-restart" class="menu-item inline-block px-4 py-2">Reiniciar</button>
        <button id="tictactoe-exit" class="menu-item inline-block px-4 py-2 ml-2">Salir</button>
      </div>
    `);

    setTimeout(() => {
      this.setupEventListeners();
    }, 100);
  }

  private getBoardHtml(): string {
    let html = '<div class="grid grid-cols-3 gap-2">';

    for (let i = 0; i < 9; i++) {
      const value = this.board[i] || ' ';
      const cellClass = this.gameOver
        ? 'cursor-not-allowed'
        : 'cursor-pointer hover:bg-terminal-dim';

      html += `
        <div
          class="w-20 h-20 border-2 border-terminal-text flex items-center justify-center text-3xl ${cellClass}"
          data-cell="${i}"
        >
          ${value}
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  private setupEventListeners(): void {
    const cells = document.querySelectorAll('[data-cell]');

    cells.forEach(cell => {
      cell.addEventListener('click', e => {
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-cell') || '0');
        this.makeMove(index);
      });
    });

    const restartBtn = document.getElementById('tictactoe-restart');
    const exitBtn = document.getElementById('tictactoe-exit');

    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.exit());
    }
  }

  private makeMove(index: number): void {
    if (this.gameOver || this.board[index] !== '' || this.currentPlayer !== 'X') {
      return;
    }

    // Jugador hace su movimiento
    this.board[index] = 'X';

    // Verificar si el jugador ganó
    if (this.checkWinner('X')) {
      this.endGame('¡Ganaste! 🎉');
      return;
    }

    // Verificar empate
    if (this.isBoardFull()) {
      this.endGame('¡Empate!');
      return;
    }

    // Turno de la IA
    this.currentPlayer = 'O';
    setTimeout(() => {
      this.aiMove();
    }, 500);
  }

  private aiMove(): void {
    const bestMove = this.getBestMove();

    if (bestMove !== -1) {
      this.board[bestMove] = 'O';

      // Verificar si la IA ganó
      if (this.checkWinner('O')) {
        this.endGame('La IA ganó. ¡Intenta de nuevo!');
        return;
      }

      // Verificar empate
      if (this.isBoardFull()) {
        this.endGame('¡Empate!');
        return;
      }

      this.currentPlayer = 'X';
      this.render();
    }
  }

  private getBestMove(): number {
    // Algoritmo Minimax simplificado

    // 1. Intentar ganar
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === '') {
        this.board[i] = 'O';
        if (this.checkWinner('O')) {
          this.board[i] = '';
          return i;
        }
        this.board[i] = '';
      }
    }

    // 2. Bloquear al jugador
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === '') {
        this.board[i] = 'X';
        if (this.checkWinner('X')) {
          this.board[i] = '';
          return i;
        }
        this.board[i] = '';
      }
    }

    // 3. Tomar el centro si está disponible
    if (this.board[4] === '') {
      return 4;
    }

    // 4. Tomar una esquina
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => this.board[i] === '');
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Tomar cualquier espacio disponible
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === '') {
        return i;
      }
    }

    return -1;
  }

  private checkWinner(player: string): boolean {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Horizontales
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Verticales
      [0, 4, 8],
      [2, 4, 6], // Diagonales
    ];

    return winPatterns.some(pattern => pattern.every(index => this.board[index] === player));
  }

  private isBoardFull(): boolean {
    return this.board.every(cell => cell !== '');
  }

  private endGame(message: string): void {
    this.gameOver = true;
    this.render();

    const messageEl = document.getElementById('tictactoe-message');
    if (messageEl) {
      const isWin = message.includes('Ganaste');
      const className = isWin ? 'text-terminal-bright' : 'text-terminal-text';
      messageEl.innerHTML = `<div class="${className} text-xl">${message}</div>`;
    }
  }

  private restart(): void {
    this.board = ['', '', '', '', '', '', '', '', ''];
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.render();
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
(window as Window).TicTacToe = TicTacToe;

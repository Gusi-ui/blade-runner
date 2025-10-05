// Tetris Game - Retro Style
import type { TerminalController } from '../types/terminal';

// Extend Window interface to include Tetris
declare global {
  interface Window {
    Tetris: typeof Tetris;
  }
}

// Tetris piece interface
interface TetrisPiece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export class Tetris {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private grid: number[][];
  private currentPiece!: TetrisPiece;
  private nextPiece!: TetrisPiece;
  private score = 0;
  private level = 1;
  private lines = 0;
  private gameLoop?: number;
  private dropTimer?: number;
  private terminal: TerminalController;

  // Tetris pieces (Tetrominoes)
  private pieces: Omit<TetrisPiece, 'x' | 'y'>[] = [
    {
      shape: [[1, 1, 1, 1]],
      color: '#00ff41',
    },
    {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: '#ffff00',
    },
    {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      color: '#ff00ff',
    },
    {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
      ],
      color: '#00ffff',
    },
    {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
      ],
      color: '#ff6600',
    },
    {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      color: '#ff0000',
    },
    {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      color: '#00ff00',
    },
  ];

  constructor(terminal: TerminalController) {
    this.terminal = terminal;
    this.grid = this.createGrid();
    this.init();
  }

  private createGrid(): number[][] {
    return Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
  }

  private init(): void {
    this.currentPiece = this.getRandomPiece();
    this.nextPiece = this.getRandomPiece();

    this.terminal.printOutput(`
      <div class="text-terminal-bright mb-4">
        ═══════════════════════════════════════════════════════════
                            TETRIS RETRO
        ═══════════════════════════════════════════════════════════
      </div>
      <div class="mb-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-terminal-bright">Puntuación: <span id="tetris-score">0</span></div>
            <div class="text-sm text-terminal-dim">Nivel: <span id="tetris-level">1</span></div>
            <div class="text-sm text-terminal-dim">Líneas: <span id="tetris-lines">0</span></div>
          </div>
          <div>
            <div class="text-terminal-bright">Siguiente:</div>
            <div id="tetris-next" class="text-xs mt-2"></div>
          </div>
        </div>
      </div>
      <div class="flex justify-center mb-4">
        <canvas id="tetris-canvas" class="game-canvas" width="300" height="600"></canvas>
      </div>
      <div class="text-center">
        <div class="text-sm text-terminal-dim mb-2">Controles: ← → ↓ para mover, ↑ para rotar, ESPACIO para caída rápida</div>
        <button id="tetris-restart" class="menu-item inline-block px-4 py-2">Reiniciar</button>
        <button id="tetris-exit" class="menu-item inline-block px-4 py-2 ml-2">Salir</button>
      </div>
    `);

    setTimeout(() => {
      this.canvas = document.getElementById('tetris-canvas') as HTMLCanvasElement;
      this.ctx = this.canvas.getContext('2d')!;

      this.setupControls();
      this.startGame();

      const restartBtn = document.getElementById('tetris-restart');
      const exitBtn = document.getElementById('tetris-exit');

      if (restartBtn) {
        restartBtn.addEventListener('click', () => this.restart());
      }

      if (exitBtn) {
        exitBtn.addEventListener('click', () => this.exit());
      }
    }, 100);
  }

  private getRandomPiece(): TetrisPiece {
    const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
    return {
      ...piece,
      x: 3,
      y: 0,
    };
  }

  private setupControls(): void {
    document.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowLeft':
          this.movePiece(-1, 0);
          e.preventDefault();
          break;
        case 'ArrowRight':
          this.movePiece(1, 0);
          e.preventDefault();
          break;
        case 'ArrowDown':
          this.movePiece(0, 1);
          e.preventDefault();
          break;
        case 'ArrowUp':
          this.rotatePiece();
          e.preventDefault();
          break;
        case ' ':
          this.dropPiece();
          e.preventDefault();
          break;
      }
    });
  }

  private startGame(): void {
    this.gameLoop = window.setInterval(() => {
      this.update();
      this.draw();
    }, 50);

    this.dropTimer = window.setInterval(
      () => {
        this.movePiece(0, 1);
      },
      1000 - this.level * 50
    );
  }

  private update(): void {
    if (!this.isValidMove(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.placePiece();
      this.clearLines();
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.getRandomPiece();

      if (!this.isValidMove(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
        this.gameOver();
      }
    }
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Draw current piece
    this.drawPiece(this.currentPiece);

    // Draw next piece preview
    this.drawNextPiece();
  }

  private drawGrid(): void {
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        if (this.grid[y][x]) {
          this.ctx.fillStyle = this.pieces[this.grid[y][x] - 1].color;
          this.ctx.fillRect(x * 30, y * 30, 28, 28);
        }
      }
    }
  }

  private drawPiece(piece: TetrisPiece): void {
    this.ctx.fillStyle = piece.color;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          this.ctx.fillRect((piece.x + x) * 30, (piece.y + y) * 30, 28, 28);
        }
      }
    }
  }

  private drawNextPiece(): void {
    const nextCanvas = document.getElementById('tetris-next');
    if (!nextCanvas) return;

    nextCanvas.innerHTML = '';

    // Create mini canvas for next piece
    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 120;
    miniCanvas.height = 120;
    const miniCtx = miniCanvas.getContext('2d')!;

    miniCtx.fillStyle = this.nextPiece.color;
    for (let y = 0; y < this.nextPiece.shape.length; y++) {
      for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
        if (this.nextPiece.shape[y][x]) {
          miniCtx.fillRect(x * 30 + 30, y * 30 + 30, 28, 28);
        }
      }
    }

    nextCanvas.appendChild(miniCanvas);
  }

  private movePiece(dx: number, dy: number): void {
    if (
      this.isValidMove(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.shape)
    ) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
    } else if (dy > 0) {
      this.placePiece();
    }
  }

  private rotatePiece(): void {
    const rotated = this.rotateMatrix(this.currentPiece.shape);
    if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
      this.currentPiece.shape = rotated;
    }
  }

  private rotateMatrix(matrix: number[][]): number[][] {
    return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
  }

  private isValidMove(x: number, y: number, shape: number[][]): boolean {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          if (newX < 0 || newX >= 10 || newY >= 20 || (newY >= 0 && this.grid[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private placePiece(): void {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const gridY = this.currentPiece.y + y;
          const gridX = this.currentPiece.x + x;

          if (gridY >= 0) {
            this.grid[gridY][gridX] =
              this.pieces.findIndex(p => p.color === this.currentPiece.color) + 1;
          }
        }
      }
    }
  }

  private clearLines(): void {
    for (let y = 19; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== 0)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array(10).fill(0));
        this.lines++;
        this.score += 100 * this.level;
        this.updateScore();

        if (this.lines % 10 === 0) {
          this.level++;
          this.updateLevel();
        }
      }
    }
  }

  private dropPiece(): void {
    while (
      this.isValidMove(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)
    ) {
      this.currentPiece.y++;
    }
    this.placePiece();
    this.clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getRandomPiece();
  }

  private updateScore(): void {
    const scoreEl = document.getElementById('tetris-score');
    if (scoreEl) scoreEl.textContent = this.score.toString();
  }

  private updateLevel(): void {
    const levelEl = document.getElementById('tetris-level');
    if (levelEl) levelEl.textContent = this.level.toString();

    if (this.dropTimer) {
      clearInterval(this.dropTimer);
      this.dropTimer = window.setInterval(
        () => {
          this.movePiece(0, 1);
        },
        Math.max(100, 1000 - this.level * 50)
      );
    }
  }

  private gameOver(): void {
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.dropTimer) clearInterval(this.dropTimer);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#00ff41';
    this.ctx.font = '30px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
  }

  private restart(): void {
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.dropTimer) clearInterval(this.dropTimer);

    this.grid = this.createGrid();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.currentPiece = this.getRandomPiece();
    this.nextPiece = this.getRandomPiece();

    this.updateScore();
    this.updateLevel();
    this.startGame();
  }

  private exit(): void {
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.dropTimer) clearInterval(this.dropTimer);

    this.terminal.printOutput('<div class="success-text">Saliendo del juego...</div>');
    setTimeout(() => {
      const event = new CustomEvent('loadView', { detail: { view: 'games' } });
      document.dispatchEvent(event);
    }, 500);
  }
}

// Exportar globalmente
window.Tetris = Tetris;

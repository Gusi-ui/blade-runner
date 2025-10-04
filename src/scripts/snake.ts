// Snake Game
export class Snake {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private gridSize = 20;
  private tileCount = 20;
  private snake: { x: number; y: number }[] = [];
  private velocityX = 0;
  private velocityY = 0;
  private apple = { x: 10, y: 10 };
  private score = 0;
  private gameLoop?: number;
  private terminal: any;

  constructor(terminal: any) {
    this.terminal = terminal;
    this.init();
  }

  private init(): void {
    this.terminal.printOutput(`
      <div class="text-terminal-bright mb-4">
        ═══════════════════════════════════════════════════════════
                            SNAKE GAME
        ═══════════════════════════════════════════════════════════
      </div>
      <div class="mb-2">Controles: Flechas del teclado o WASD</div>
      <div class="mb-4">Puntuación: <span id="snake-score">0</span></div>
      <div class="flex justify-center">
        <canvas id="snake-canvas" class="game-canvas" width="400" height="400"></canvas>
      </div>
      <div class="text-center mt-4">
        <button id="snake-restart" class="menu-item inline-block px-4 py-2">Reiniciar</button>
        <button id="snake-exit" class="menu-item inline-block px-4 py-2 ml-2">Salir</button>
      </div>
    `);

    setTimeout(() => {
      this.canvas = document.getElementById('snake-canvas') as HTMLCanvasElement;
      this.ctx = this.canvas.getContext('2d')!;

      this.resetGame();
      this.setupControls();
      this.startGame();

      const restartBtn = document.getElementById('snake-restart');
      const exitBtn = document.getElementById('snake-exit');

      if (restartBtn) {
        restartBtn.addEventListener('click', () => this.restart());
      }

      if (exitBtn) {
        exitBtn.addEventListener('click', () => this.exit());
      }
    }, 100);
  }

  private resetGame(): void {
    this.snake = [{ x: 10, y: 10 }];
    this.velocityX = 0;
    this.velocityY = 0;
    this.score = 0;
    this.placeApple();
    this.updateScore();
  }

  private setupControls(): void {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.velocityY === 0) {
            this.velocityX = 0;
            this.velocityY = -1;
          }
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.velocityY === 0) {
            this.velocityX = 0;
            this.velocityY = 1;
          }
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.velocityX === 0) {
            this.velocityX = -1;
            this.velocityY = 0;
          }
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.velocityX === 0) {
            this.velocityX = 1;
            this.velocityY = 0;
          }
          e.preventDefault();
          break;
      }
    });
  }

  private startGame(): void {
    this.gameLoop = window.setInterval(() => {
      this.update();
      this.draw();
    }, 100);
  }

  private update(): void {
    // Mover serpiente
    const head = { x: this.snake[0].x + this.velocityX, y: this.snake[0].y + this.velocityY };

    // Verificar colisiones con paredes
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Verificar colisiones con el cuerpo
    for (const segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.gameOver();
        return;
      }
    }

    this.snake.unshift(head);

    // Verificar si comió manzana
    if (head.x === this.apple.x && head.y === this.apple.y) {
      this.score += 10;
      this.updateScore();
      this.placeApple();
    } else {
      this.snake.pop();
    }
  }

  private draw(): void {
    // Fondo
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Serpiente
    this.ctx.fillStyle = '#00ff41';
    this.snake.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? '#39ff14' : '#00ff41';
      this.ctx.fillRect(
        segment.x * this.gridSize,
        segment.y * this.gridSize,
        this.gridSize - 2,
        this.gridSize - 2
      );
    });

    // Manzana
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(
      this.apple.x * this.gridSize,
      this.apple.y * this.gridSize,
      this.gridSize - 2,
      this.gridSize - 2
    );
  }

  private placeApple(): void {
    this.apple = {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount)
    };

    // Asegurar que la manzana no esté en la serpiente
    for (const segment of this.snake) {
      if (segment.x === this.apple.x && segment.y === this.apple.y) {
        this.placeApple();
        return;
      }
    }
  }

  private updateScore(): void {
    const scoreEl = document.getElementById('snake-score');
    if (scoreEl) {
      scoreEl.textContent = this.score.toString();
    }
  }

  private gameOver(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#00ff41';
    this.ctx.font = '30px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.font = '20px monospace';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
  }

  private restart(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.resetGame();
    this.startGame();
  }

  private exit(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.terminal.printOutput('<div class="success-text">Saliendo del juego...</div>');
    setTimeout(() => {
      const event = new CustomEvent('loadView', { detail: { view: 'games' } });
      document.dispatchEvent(event);
    }, 500);
  }
}

// Exportar globalmente
(window as any).Snake = Snake;

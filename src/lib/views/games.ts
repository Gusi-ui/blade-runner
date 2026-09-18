// Vista «games» de la terminal. Se instala al abrir la terminal por primera vez
// (lazy.ts): su código no se descarga con la página.
let installed = false;

export const install = (): void => {
  if (installed) return;
  installed = true;

  const loadGameModule = async (game: string) => {
    switch (game) {
      case 'snake':
        await import('../../scripts/snake.ts');
        break;
      case 'tetris':
        await import('../../scripts/tetris.ts');
        break;
      case 'hangman':
        await import('../../scripts/hangman.ts');
        break;
      case 'tictactoe':
        await import('../../scripts/tictactoe.ts');
        break;
    }
  };

  // 'juegos snake' o 'juegos 1' lanzan el juego directamente.
  const GAMES = ['snake', 'tetris', 'hangman', 'tictactoe'];
  const resolveGame = (arg?: string): string | undefined => {
    const a = arg?.toLowerCase();
    if (!a) return undefined;
    return GAMES.includes(a) ? a : GAMES[Number(a) - 1];
  };

  document.addEventListener('loadView', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail.view !== 'games') return;

    const terminal = window.terminal;
    const gamesComponent = document.getElementById('games-component');
    if (!terminal || !gamesComponent) return;

    const direct = resolveGame(customEvent.detail.args?.[0] as string | undefined);
    if (direct) {
      void loadGame(direct);
      return;
    }

    terminal.printOutput(gamesComponent.innerHTML);

    // Listeners solo en el bloque recién impreso: con querySelectorAll global
    // cada 'juegos' volvía a enganchar los bloques anteriores (juego lanzado 2 veces).
    const blocks = document.querySelectorAll('#output-container .terminal-output');
    const root = blocks[blocks.length - 1];
    root?.querySelectorAll<HTMLElement>('[data-game]').forEach(item => {
      item.addEventListener('click', () => {
        const game = item.dataset.game;
        if (game) void loadGame(game);
      });
    });
  });

  async function loadGame(game: string): Promise<void> {
    const terminal = window.terminal;
    if (!terminal) return;

    await loadGameModule(game);

    switch (game) {
      case 'snake':
        if (window.Snake) new window.Snake(terminal);
        break;
      case 'tetris':
        if (window.Tetris) new window.Tetris(terminal);
        break;
      case 'hangman':
        if (window.Hangman) new window.Hangman(terminal);
        break;
      case 'tictactoe':
        if (window.TicTacToe) new window.TicTacToe(terminal);
        break;
    }
  }
};

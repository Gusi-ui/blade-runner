// Definición de tipos globales para el sistema terminal

export interface TerminalController {
  printOutput: (html: string) => void;
}

// Tipos para las clases de juegos
export interface GameClass {
  new (terminal: TerminalController): unknown;
}

declare global {
  interface Window {
    terminal?: TerminalController;
    Snake?: GameClass;
    Tetris?: GameClass;
    Hangman?: GameClass;
    TicTacToe?: GameClass;
    apodViewer?: unknown;
    newsFeed?: unknown;
    handleNASAImageError?: (
      imgElement: HTMLImageElement,
      originalUrl: string,
      date: string
    ) => void;
  }
}

export {};

import { initMatrixBackground } from '../effects/matrixBackground';
import { renderBootInstant } from './boot';
import { chipsFor } from './chips';
import { TerminalController } from './controller';
import { createTerminalSheet, type TerminalSheet } from './sheet';

// Monta la terminal sobre el marcado de TerminalSheet/Terminal. Lo llama lazy.ts
// al abrirla por primera vez (antes vivía en el <script> de Terminal.astro).

const renderChips = (container: HTMLElement, view: string): void => {
  container.replaceChildren(
    ...chipsFor(view).map(cmd => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'quick-chip';
      chip.dataset.cmd = cmd;
      chip.textContent = cmd;
      return chip;
    })
  );
};

export const mountTerminal = (): TerminalSheet => {
  // Atajos según la vista activa: la escucha va antes que el controlador, que
  // emite 'viewchange' en su navegación inicial por hash.
  const quickActions = document.getElementById('quick-actions');
  if (quickActions) {
    renderChips(quickActions, '');
    document.addEventListener('viewchange', e =>
      renderChips(quickActions, (e as CustomEvent).detail.view)
    );
  }

  window.terminal = new TerminalController();

  // La capa se crea en el mismo tick que el controlador: su navegación inicial
  // por hash (setTimeout 0) ya la encuentra.
  const dialog = document.getElementById('terminal-sheet') as HTMLDialogElement;
  const input = document.getElementById('terminal-input') as HTMLInputElement;
  const sheet = createTerminalSheet(
    dialog,
    cmd => window.terminal?.run?.(cmd),
    () => input.focus()
  );
  window.terminalSheet = sheet;
  initMatrixBackground(dialog);
  document.querySelector('[data-close-terminal]')?.addEventListener('click', () => sheet.close());

  const bootOutput = document.getElementById('boot-output');
  if (bootOutput) renderBootInstant(bootOutput);
  return sheet;
};

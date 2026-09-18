import { mountCalculator } from '../calculator';

// Vista «calculator» de la terminal. Se instala al abrir la terminal por primera vez
// (lazy.ts): su código no se descarga con la página.
let installed = false;

export const install = (): void => {
  if (installed) return;
  installed = true;

  document.addEventListener('loadView', e => {
    const { view } = (e as CustomEvent).detail;
    if (view !== 'calculator' || !window.terminal) return;
    const template = document.getElementById('calculator-component');
    if (!template) return;
    window.terminal.printOutput(template.innerHTML);
    // Se engancha al bloque recién impreso (los ids se repiten en cada «calculadora»).
    const blocks = document.querySelectorAll('#output-container .terminal-output');
    const root = blocks[blocks.length - 1];
    if (root) mountCalculator(root, window.terminal);
  });
};

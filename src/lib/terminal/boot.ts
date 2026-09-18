import { prefersInstant, typeText } from './typewriter';

// Secuencia de arranque animada. Se muestra completa una vez por sesión
// (sessionStorage) y cualquier tecla o click la salta.

const BOOT_LINES: { text: string; className: string }[] = [
  { text: '✓ Nexus-7 listo.', className: 'success-text mb-1' },
  {
    text: "Toca un atajo o escribe 'help' para ver los comandos.",
    className: 'text-terminal-dim mb-4',
  },
];

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const renderBootInstant = (container: HTMLElement): void => {
  container.innerHTML = '';
  for (const line of BOOT_LINES) {
    const p = document.createElement('p');
    p.className = line.className;
    p.textContent = line.text;
    container.appendChild(p);
  }
};

export const runBootSequence = async (container: HTMLElement): Promise<void> => {
  const seen = sessionStorage.getItem('nexus-boot-seen');
  sessionStorage.setItem('nexus-boot-seen', 'true');

  if (seen || prefersInstant()) {
    renderBootInstant(container);
    return;
  }

  container.innerHTML = '';
  const abort = new AbortController();
  const skip = (): void => abort.abort();
  document.addEventListener('keydown', skip, { signal: abort.signal });
  document.addEventListener('pointerdown', skip, { signal: abort.signal });

  for (const line of BOOT_LINES) {
    const p = document.createElement('p');
    p.className = line.className;
    container.appendChild(p);
    await typeText(p, line.text, { charsPerSecond: 60, signal: abort.signal });
    if (!abort.signal.aborted) await delay(150);
  }

  abort.abort(); // limpia los listeners de salto
};

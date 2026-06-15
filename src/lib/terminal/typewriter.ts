// Efecto máquina de escribir con requestAnimationFrame.
// Respeta prefers-reduced-motion y el modo reduced-effects del usuario.

export const prefersInstant = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.body.classList.contains('reduced-effects');

export interface TypeOptions {
  charsPerSecond?: number;
  /** Al abortar, el texto se completa instantáneamente. */
  signal?: AbortSignal;
}

export const typeText = (
  el: HTMLElement,
  text: string,
  { charsPerSecond = 80, signal }: TypeOptions = {}
): Promise<void> =>
  new Promise(resolve => {
    if (prefersInstant() || signal?.aborted) {
      el.textContent = text;
      resolve();
      return;
    }

    let shown = 0;
    let last = performance.now();

    const step = (now: number): void => {
      if (signal?.aborted) {
        el.textContent = text;
        resolve();
        return;
      }
      const chars = Math.max(1, Math.round(((now - last) / 1000) * charsPerSecond));
      shown = Math.min(text.length, shown + chars);
      last = now;
      el.textContent = text.slice(0, shown);
      if (shown < text.length) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });

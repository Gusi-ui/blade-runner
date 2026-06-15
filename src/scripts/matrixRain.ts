// Lluvia Matrix a pantalla completa en un canvas overlay.
// Se cierra con cualquier tecla, click o toque.

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFXYZ$#@*+-';

export const startMatrixRain = (): void => {
  if (document.getElementById('matrix-rain-overlay')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'matrix-rain-overlay';
  canvas.className = 'fixed inset-0 z-[300] bg-black';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const fontSize = 16;
  const columns = Math.ceil(canvas.width / fontSize);
  const drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));

  let rafId = 0;
  let lastFrame = 0;

  const abort = new AbortController();
  const cleanup = (): void => {
    abort.abort();
    cancelAnimationFrame(rafId);
    canvas.remove();
  };
  document.addEventListener('keydown', cleanup, { signal: abort.signal });
  document.addEventListener('pointerdown', cleanup, { signal: abort.signal });

  const draw = (now: number): void => {
    rafId = requestAnimationFrame(draw);
    if (now - lastFrame < 50) return; // ~20 fps, suficiente y barato
    lastFrame = now;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      ctx.fillStyle = '#00ff41';
      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  };

  rafId = requestAnimationFrame(draw);
};

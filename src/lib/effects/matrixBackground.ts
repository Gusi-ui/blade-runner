// Fondo sutil de "lluvia Matrix" detrás del terminal. A diferencia del easter
// egg a pantalla completa (scripts/matrixRain.ts), este es persistente, muy
// tenue, no captura interacción y se pausa con `reduced-effects`, con
// prefers-reduced-motion y cuando la pestaña está oculta (ahorro de batería).

const CHARS = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFXYZ$#@*+-';
const FONT_SIZE = 16;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let drops: number[] = [];
let rafId = 0;
let lastFrame = 0;
let running = false;

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// La clase la añade index.astro en DOMContentLoaded; este módulo puede correr
// antes, así que consultamos también localStorage (fuente de verdad) para no
// arrancar la lluvia si el usuario la tenía desactivada.
const effectsDisabled = (): boolean =>
  document.body.classList.contains('reduced-effects') ||
  localStorage.getItem('nexus-reduced-effects') === 'true';

const resize = (): void => {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const columns = Math.ceil(canvas.width / FONT_SIZE);
  drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));
};

const draw = (now: number): void => {
  rafId = requestAnimationFrame(draw);
  if (!ctx || !canvas) return;
  if (now - lastFrame < 60) return; // ~16 fps: de sobra para un fondo y barato
  lastFrame = now;

  // Rastro que se desvanece: rectángulo negro semitransparente cada frame.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.fillStyle = '#00ff41';

  for (let i = 0; i < drops.length; i++) {
    const char = CHARS[Math.floor(Math.random() * CHARS.length)];
    ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);
    if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
};

const start = (): void => {
  if (running || effectsDisabled() || reducedMotion()) return;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'matrix-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resize);
  }
  if (!ctx) return;
  resize();
  running = true;
  rafId = requestAnimationFrame(draw);
};

const stop = (): void => {
  running = false;
  cancelAnimationFrame(rafId);
};

export const initMatrixBackground = (): void => {
  start();

  // 'config > efectos' alterna body.reduced-effects y emite este evento.
  document.addEventListener('effectschange', () => (effectsDisabled() ? stop() : start()));

  // Pausa cuando la pestaña no está visible.
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
};

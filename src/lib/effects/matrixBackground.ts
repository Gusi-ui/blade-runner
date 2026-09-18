// Efecto retro opcional: «lluvia Matrix» tenue detrás de la terminal (dentro de la
// capa). Apagado por defecto: se activa con `config` → Efectos (localStorage
// 'nexus-effects' = 'on'). Solo se anima con la capa abierta, la pestaña visible
// y sin prefers-reduced-motion.

const CHARS = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFXYZ$#@*+-';
const FONT_SIZE = 16;

let host: HTMLDialogElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let drops: number[] = [];
let rafId = 0;
let lastFrame = 0;
let running = false;

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const effectsEnabled = (): boolean => {
  try {
    return localStorage.getItem('nexus-effects') === 'on';
  } catch {
    return false;
  }
};

const resize = (): void => {
  if (!canvas || !host) return;
  canvas.width = host.clientWidth;
  canvas.height = host.clientHeight;
  const columns = Math.ceil(canvas.width / FONT_SIZE);
  drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));
};

const draw = (now: number): void => {
  rafId = requestAnimationFrame(draw);
  if (!ctx || !canvas) return;
  if (now - lastFrame < 60) return; // ~16 fps: de sobra para un fondo y barato
  lastFrame = now;

  ctx.fillStyle = 'rgba(11, 13, 16, 0.12)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.fillStyle = getComputedStyle(host ?? document.body).getPropertyValue('--color-accent');

  for (let i = 0; i < drops.length; i++) {
    const char = CHARS[Math.floor(Math.random() * CHARS.length)];
    ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);
    if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
};

const start = (): void => {
  if (running || !host?.open || document.hidden || !effectsEnabled() || reducedMotion()) return;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'matrix-bg';
    canvas.className = 'matrix-bg';
    canvas.setAttribute('aria-hidden', 'true');
    host.prepend(canvas);
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resize);
  }
  if (!ctx) return;
  canvas.hidden = false;
  resize();
  running = true;
  rafId = requestAnimationFrame(draw);
};

const stop = (): void => {
  running = false;
  cancelAnimationFrame(rafId);
  if (canvas && !effectsEnabled()) canvas.hidden = true;
};

export const initMatrixBackground = (dialog: HTMLDialogElement): void => {
  host = dialog;
  // La capa emite 'sheetopen' al abrirse; el <dialog> emite 'close' al cerrarse.
  document.addEventListener('sheetopen', start);
  dialog.addEventListener('close', stop);
  document.addEventListener('effectschange', () => (effectsEnabled() ? start() : stop()));
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
};

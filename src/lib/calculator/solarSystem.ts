// Sistema solar animado (simulado) en un <canvas>. Devuelve la función que lo detiene.
// Con prefers-reduced-motion dibuja un único fotograma.

const PLANETS = [
  { distance: 40, speed: 0.04, size: 3, color: '#8c7853' },
  { distance: 60, speed: 0.03, size: 4, color: '#ffc649' },
  { distance: 80, speed: 0.02, size: 4, color: '#6b93d6' },
  { distance: 100, speed: 0.018, size: 3, color: '#cd5c5c' },
  { distance: 140, speed: 0.013, size: 8, color: '#d8ca9d' },
  { distance: 180, speed: 0.009, size: 7, color: '#fad5a5' },
];

export const startSolarSystem = (canvas: HTMLCanvasElement): (() => void) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  const angles = PLANETS.map(() => 0);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  let frame = 0;

  const draw = (): void => {
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      ctx.fillRect((i * 37) % canvas.width, (i * 23) % canvas.height, 1, 1);
    }

    const sun = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
    sun.addColorStop(0, '#ffff00');
    sun.addColorStop(0.5, '#ff6600');
    sun.addColorStop(1, '#ff0000');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    PLANETS.forEach((p, i) => {
      angles[i] += p.speed;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(cx, cy, p.distance, 0, Math.PI * 2);
      ctx.stroke();

      const x = cx + Math.cos(angles[i]) * p.distance;
      const y = cy + Math.sin(angles[i]) * p.distance;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw();
    return () => undefined;
  }

  const loop = (): void => {
    // Se detiene sola si el canvas sale del DOM (p. ej. con `clear`).
    if (!canvas.isConnected) return;
    draw();
    frame = requestAnimationFrame(loop);
  };
  loop();
  return () => cancelAnimationFrame(frame);
};

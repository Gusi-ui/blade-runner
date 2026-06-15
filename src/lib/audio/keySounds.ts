// Sonido mecánico de teclas con WebAudio (osciladores, sin samples).
// Desactivado por defecto; se persiste en localStorage ('nexus-sound').

const STORAGE_KEY = 'nexus-sound';

let audioContext: AudioContext | null = null;

export const isSoundEnabled = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // sin almacenamiento disponible
  }
};

export const toggleSound = (): boolean => {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
};

const getContext = (): AudioContext | null => {
  // Lazy: el AudioContext solo puede crearse tras un gesto del usuario
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
};

/** Blip corto de tecla mecánica; 'enter' suena más grave y largo. */
export const playKeySound = (kind: 'key' | 'enter' = 'key'): void => {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  const baseFreq = kind === 'enter' ? 140 : 220;
  osc.frequency.setValueAtTime(baseFreq + Math.random() * 40, now);

  const duration = kind === 'enter' ? 0.06 : 0.03;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
};

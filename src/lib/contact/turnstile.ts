// Widget de Turnstile del formulario de contacto. El script de Cloudflare se
// carga solo cuando el formulario se acerca a la pantalla (no pesa en la carga
// inicial) y el widget se dibuja de forma explícita para poder reiniciarlo: cada
// token sirve una sola vez.

// Clave pública del widget «gusi.dev contacto» (dominios: gusi.dev, dev.gusi.dev,
// localhost). Las pruebas pueden usar la clave de pruebas de Cloudflare.
const SITEKEY = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || '0x4AAAAAAE8EyGdeaUE_bXqW';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TURNSTILE_ACTION = 'contact';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

const loadScript = (): Promise<TurnstileApi> =>
  (scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'));
    script.onerror = () => {
      scriptPromise = null; // permite reintentar (p. ej. sin conexión)
      reject(new Error('turnstile'));
    };
    document.head.appendChild(script);
  }));

/** Dibuja el widget dentro de [data-turnstile] del formulario (una sola vez). */
export const mountTurnstile = async (form: HTMLFormElement): Promise<void> => {
  const container = form.querySelector<HTMLElement>('[data-turnstile]');
  if (!container || form.dataset.turnstileId) return;
  const api = await loadScript();
  if (form.dataset.turnstileId) return;
  form.dataset.turnstileId = api.render(container, {
    sitekey: SITEKEY,
    action: TURNSTILE_ACTION,
    theme: 'dark',
    language: 'es',
  });
};

/** Token actual del widget (Turnstile lo deja en un input oculto del formulario). */
export const turnstileToken = (form: HTMLFormElement): string =>
  String(new FormData(form).get('cf-turnstile-response') ?? '');

/** Tras cada envío: los tokens son de un solo uso, hay que pedir uno nuevo. */
export const resetTurnstile = (form: HTMLFormElement): void => {
  const id = form.dataset.turnstileId;
  if (id) window.turnstile?.reset(id);
};

/** Carga el widget cuando el formulario está a punto de verse (o al interactuar). */
export const watchContactForm = (form: HTMLFormElement): void => {
  const load = (): void => void mountTurnstile(form).catch(() => undefined);
  form.addEventListener('focusin', load, { once: true });
  if (!('IntersectionObserver' in window)) return load();
  const observer = new IntersectionObserver(
    entries => {
      if (entries.some(e => e.isIntersecting)) {
        observer.disconnect();
        load();
      }
    },
    { rootMargin: '400px 0px' }
  );
  observer.observe(form);
};

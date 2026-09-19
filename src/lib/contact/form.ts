import { getApiBase } from '../api/client';
import { mountTurnstile, resetTurnstile, turnstileToken } from './turnstile';

// Envío del formulario de contacto (página y vista de la terminal comparten
// contrato: [data-contact-form] con [data-contact-status]). Delegado en document
// para que funcione también con el HTML que la terminal inyecta.

type Status = 'pending' | 'ok' | 'error';

const STATUS_CLASS: Record<Status, string> = {
  pending: 'text-muted',
  ok: 'text-accent',
  error: 'text-red-400',
};

let installed = false;

export const installContactForm = (): void => {
  if (installed) return;
  installed = true;

  document.addEventListener('submit', async (e: Event) => {
    const form = (e.target as HTMLElement)?.closest<HTMLFormElement>('[data-contact-form]');
    if (!form) return;
    e.preventDefault();

    const status = form.querySelector<HTMLElement>('[data-contact-status]');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const setStatus = (text: string, kind: Status): void => {
      if (status) {
        status.textContent = text;
        status.className = `text-sm ${STATUS_CLASS[kind]}`;
      }
    };

    // Turnstile: sin token todavía (widget cargando o reto sin completar) no se
    // envía; el Worker lo rechazaría igualmente.
    const token = turnstileToken(form);
    if (!token) {
      void mountTurnstile(form).catch(() => undefined);
      setStatus('Un momento: completa la verificación de seguridad y vuelve a enviar.', 'error');
      return;
    }

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      message: String(data.get('message') || ''),
      website: String(data.get('website') || ''),
      'cf-turnstile-response': token,
    };

    setStatus('Enviando…', 'pending');
    if (submit) submit.disabled = true;

    try {
      const apiBase = getApiBase();
      if (!apiBase) throw new Error('no-api');
      const res = await fetch(`${apiBase}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        form.reset();
        setStatus('✓ Mensaje enviado. ¡Gracias!', 'ok');
      } else {
        setStatus(json.error || 'No se pudo enviar el mensaje.', 'error');
        if (submit) submit.disabled = false;
      }
    } catch {
      setStatus('No hay conexión con el servidor de contacto.', 'error');
      if (submit) submit.disabled = false;
    } finally {
      // El token ya se ha canjeado (o caducado): nuevo reto para el siguiente envío.
      resetTurnstile(form);
    }
  });
};

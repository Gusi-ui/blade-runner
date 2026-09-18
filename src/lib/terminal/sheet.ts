// Capa a pantalla completa de la terminal (<dialog id="terminal-sheet">).
// Abrir añade una entrada al historial (#terminal o la vista): «atrás», ✕ y Esc cierran.

export interface TerminalSheetApi {
  open(command?: string): void;
  close(): void;
  isOpen(): boolean;
}

export type TerminalSheet = TerminalSheetApi & { show(): void; hide(): void };

export const createTerminalSheet = (
  dialog: HTMLDialogElement,
  run: (command: string) => void,
  focusInput: () => void
): TerminalSheet => {
  let scrollY = 0;

  const show = (): void => {
    if (dialog.open) return;
    scrollY = window.scrollY;
    dialog.showModal();
    document.documentElement.classList.add('sheet-open');
    focusInput();
  };

  const hide = (): void => {
    if (!dialog.open) return;
    dialog.close();
    document.documentElement.classList.remove('sheet-open');
    window.scrollTo({ top: scrollY });
  };

  const api: TerminalSheet = {
    show,
    hide,
    open(command) {
      if (!dialog.open) {
        history.pushState({ sheet: true }, '', command ? `#${command}` : '#terminal');
      }
      show();
      if (command) run(command);
    },
    close() {
      // Si la abrimos nosotros, «atrás» deja la URL como estaba; si se entró con
      // un enlace directo (#apod), se limpia el hash sin salir de la web.
      if (history.state?.sheet) history.back();
      else {
        history.replaceState(null, '', location.pathname + location.search);
        hide();
      }
    },
    isOpen: () => dialog.open,
  };

  // Esc: el <dialog> dispara «cancel»; lo convertimos en close() para mantener el historial.
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    api.close();
  });
  window.addEventListener('popstate', () => {
    if (!history.state?.sheet && !/^#(terminal|[a-z])/i.test(location.hash)) hide();
  });
  document.addEventListener('click', e => {
    const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-open-terminal]');
    if (!trigger) return;
    e.preventDefault();
    api.open(trigger.dataset.command);
  });

  return api;
};

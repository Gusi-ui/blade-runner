import { isSoundEnabled, toggleSound } from '../audio/keySounds';
import { effectsEnabled } from '../effects/matrixBackground';
import type { TerminalContext } from './registry';

// Menú interactivo de configuración (tema, efectos, sonido), extraído del
// controlador. Solo se ejecuta en el navegador.

export const THEMES: Record<string, string> = {
  classic: 'Clásico (verde)',
  cyberpunk: 'Cyberpunk (cian)',
  retro: 'Retro (ámbar)',
  phosphor: 'Phosphor (blanco)',
};

export const applyTheme = (ctx: TerminalContext, theme: string | null): void => {
  // El tema cambia --color-accent dentro de la terminal (tokens.css).
  const selected = theme && THEMES[theme] ? theme : 'classic';
  if (selected === 'classic') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = selected;
  try {
    localStorage.setItem('nexus-theme', selected);
  } catch {
    /* sin almacenamiento: el tema dura solo esta visita */
  }
  ctx.print(`<div class="success-text">Tema ${THEMES[selected]} aplicado.</div>`);
};

const handleConfig = (ctx: TerminalContext, config: string | null): void => {
  switch (config) {
    case 'theme': {
      const items = Object.entries(THEMES)
        .map(
          ([name, label]) =>
            `<button type="button" class="menu-item" data-theme="${name}">${label}</button>`
        )
        .join('');
      ctx.print(`
 <div class="border border-terminal-dim p-4 rounded">
   <div class="text-terminal-bright">Temas Disponibles:</div>
   <div class="mt-2 space-y-2">${items}</div>
 </div>
      `);
      break;
    }
    case 'effects': {
      const on = effectsEnabled();
      ctx.print(`
 <div class="border border-terminal-dim p-4 rounded">
   <div class="text-terminal-bright">Efecto retro</div>
   <div class="mt-2 space-y-2">
     <button type="button" class="menu-item" data-effect="toggle">${on ? 'Desactivar efecto retro' : 'Activar efecto retro (lluvia Matrix)'}</button>
   </div>
 </div>
      `);
      break;
    }
    case 'sound':
      ctx.print(`
 <div class="border border-terminal-dim p-4 rounded">
   <div class="text-terminal-bright">Configuración de Sonido:</div>
   <div class="mt-2">
     <button type="button" class="menu-item" data-sound="toggle">Sonido de teclas mecánico: <span class="text-terminal-bright">${isSoundEnabled() ? 'Activado' : 'Desactivado'}</span> — pulsa para cambiar</button>
     <div class="text-sm text-terminal-dim mt-2">Sonido generado con WebAudio, sin descargas. Se guarda tu preferencia.</div>
   </div>
 </div>
      `);
      break;
    case 'reset':
      localStorage.removeItem('nexus-theme');
      localStorage.removeItem('nexus-reduced-effects');
      localStorage.removeItem('nexus-sound');
      localStorage.removeItem('nexus-effects');
      document.body.classList.remove('reduced-effects');
      document.dispatchEvent(new CustomEvent('effectschange'));
      ctx.print(
        '<div class="success-text">Configuración restaurada a valores predeterminados.</div>'
      );
      applyTheme(ctx, 'classic');
      break;
  }
};

const toggleEffect = (ctx: TerminalContext): void => {
  const next = !effectsEnabled();
  try {
    localStorage.setItem('nexus-effects', next ? 'on' : 'off');
  } catch {
    /* sin almacenamiento: el cambio dura solo esta visita */
  }
  document.dispatchEvent(new CustomEvent('effectschange'));
  ctx.print(`<div class="success-text">Efecto retro ${next ? 'activado' : 'desactivado'}.</div>`);
};

const toggleKeySound = (ctx: TerminalContext): void => {
  const enabled = toggleSound();
  ctx.print(
    `<div class="success-text">Sonido de teclas ${enabled ? 'activado' : 'desactivado'}.</div>`
  );
};

// Una sola escucha delegada para todos los botones de configuración: sin esperas
// (un toque rápido no se pierde) y sin duplicar escuchas al abrir config varias veces.
let configCtx: TerminalContext | null = null;
const installDelegation = (ctx: TerminalContext): void => {
  if (configCtx) {
    configCtx = ctx;
    return;
  }
  configCtx = ctx;
  document.addEventListener('click', e => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-config], [data-theme], [data-effect], [data-sound]'
    );
    if (!el || !configCtx) return;
    if (el.dataset.config) handleConfig(configCtx, el.dataset.config);
    else if (el.dataset.theme) applyTheme(configCtx, el.dataset.theme);
    else if (el.dataset.effect) toggleEffect(configCtx);
    else if (el.dataset.sound) toggleKeySound(configCtx);
  });
};

export const showConfig = (ctx: TerminalContext): void => {
  installDelegation(ctx);
  ctx.print(`
 <div class="section-title">
   Configuración del Sistema
 </div>
 <div class="space-y-4">
   <div class="border-l-2 border-terminal-dim pl-4 py-2">
     <div class="text-terminal-bright">Opciones de Personalización</div>
     <div class="mt-2 space-y-2">
       <button type="button" class="menu-item" data-config="theme">Tema de Color</button>
       <button type="button" class="menu-item" data-config="effects">Efecto retro</button>
       <button type="button" class="menu-item" data-config="sound">Sonido de Teclas</button>
       <button type="button" class="menu-item" data-config="reset">Restaurar Predeterminados</button>
     </div>
   </div>
   <div class="text-sm text-terminal-dim">Selecciona una opción para personalizar.</div>
 </div>
  `);
};

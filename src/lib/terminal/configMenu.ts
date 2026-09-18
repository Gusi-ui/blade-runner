import { isSoundEnabled, toggleSound } from '../audio/keySounds';
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
      setTimeout(() => {
        document.querySelectorAll('[data-theme]').forEach(item => {
          item.addEventListener('click', () => {
            applyTheme(ctx, item.getAttribute('data-theme'));
          });
        });
      }, 100);
      break;
    }
    case 'effects': {
      const reduced = document.body.classList.contains('reduced-effects');
      ctx.print(`
 <div class="border border-terminal-dim p-4 rounded">
   <div class="text-terminal-bright">Efectos Visuales:</div>
   <div class="mt-2 space-y-2">
     <button type="button" class="menu-item" data-effect="toggle">${reduced ? 'Activar efectos visuales' : 'Modo solo texto (ahorro batería)'}</button>
   </div>
 </div>
      `);
      setTimeout(() => {
        document.querySelector('[data-effect="toggle"]')?.addEventListener('click', () => {
          document.body.classList.toggle('reduced-effects');
          const isReduced = document.body.classList.contains('reduced-effects');
          localStorage.setItem('nexus-reduced-effects', String(isReduced));
          // Que el fondo Matrix (y otros efectos JS) reaccionen al cambio.
          document.dispatchEvent(new CustomEvent('effectschange'));
          ctx.print(
            `<div class="success-text">Efectos visuales ${isReduced ? 'desactivados' : 'activados'}.</div>`
          );
        });
      }, 100);
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
      setTimeout(() => {
        document.querySelector('[data-sound="toggle"]')?.addEventListener('click', () => {
          const enabled = toggleSound();
          ctx.print(
            `<div class="success-text">Sonido de teclas ${enabled ? 'activado' : 'desactivado'}.</div>`
          );
        });
      }, 100);
      break;
    case 'reset':
      localStorage.removeItem('nexus-theme');
      localStorage.removeItem('nexus-reduced-effects');
      localStorage.removeItem('nexus-sound');
      document.body.classList.remove('reduced-effects');
      ctx.print(
        '<div class="success-text">Configuración restaurada a valores predeterminados.</div>'
      );
      applyTheme(ctx, 'classic');
      break;
  }
};

export const showConfig = (ctx: TerminalContext): void => {
  ctx.print(`
 <div class="section-title">
   Configuración del Sistema
 </div>
 <div class="space-y-4">
   <div class="border-l-2 border-terminal-dim pl-4 py-2">
     <div class="text-terminal-bright">Opciones de Personalización</div>
     <div class="mt-2 space-y-2">
       <button type="button" class="menu-item" data-config="theme">Tema de Color</button>
       <button type="button" class="menu-item" data-config="effects">Efectos Visuales</button>
       <button type="button" class="menu-item" data-config="sound">Sonido de Teclas</button>
       <button type="button" class="menu-item" data-config="reset">Restaurar Predeterminados</button>
     </div>
   </div>
   <div class="text-sm text-terminal-dim">Selecciona una opción para personalizar.</div>
 </div>
  `);

  setTimeout(() => {
    document.querySelectorAll('[data-config]').forEach(item => {
      item.addEventListener('click', () => {
        handleConfig(ctx, item.getAttribute('data-config'));
      });
    });
  }, 100);
};

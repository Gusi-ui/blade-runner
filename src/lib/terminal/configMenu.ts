import type { TerminalContext } from './registry';

// Menú interactivo de configuración (tema, efectos, sonido), extraído del
// controlador. Solo se ejecuta en el navegador.

export const applyTheme = (ctx: TerminalContext, theme: string | null): void => {
  const body = document.body;
  body.classList.remove('theme-classic', 'theme-cyberpunk', 'theme-retro');

  switch (theme) {
    case 'cyberpunk':
      body.classList.add('theme-cyberpunk');
      localStorage.setItem('nexus-theme', 'cyberpunk');
      ctx.print('<div class="success-text">Tema Cyberpunk aplicado.</div>');
      break;
    case 'retro':
      body.classList.add('theme-retro');
      localStorage.setItem('nexus-theme', 'retro');
      ctx.print('<div class="success-text">Tema Retro aplicado.</div>');
      break;
    default:
      body.classList.add('theme-classic');
      localStorage.setItem('nexus-theme', 'classic');
      ctx.print('<div class="success-text">Tema Clásico aplicado.</div>');
  }
};

const handleConfig = (ctx: TerminalContext, config: string | null): void => {
  switch (config) {
    case 'theme':
      ctx.print(`
 <div class="border border-terminal-dim p-4 rounded">
   <div class="text-terminal-bright">Temas Disponibles:</div>
   <div class="mt-2 space-y-2">
     <div class="menu-item" data-theme="classic">Clásico (Verde Matrix)</div>
     <div class="menu-item" data-theme="cyberpunk">Cyberpunk (Azul Neón)</div>
     <div class="menu-item" data-theme="retro">Retro (Ámbar)</div>
   </div>
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
    case 'effects': {
      const reduced = document.body.classList.contains('reduced-effects');
      ctx.print(`
 <div class="border border-terminal-dim p-4 rounded">
   <div class="text-terminal-bright">Efectos Visuales:</div>
   <div class="mt-2 space-y-2">
     <div class="menu-item" data-effect="toggle">${reduced ? 'Activar efectos visuales' : 'Modo solo texto (ahorro batería)'}</div>
   </div>
 </div>
      `);
      setTimeout(() => {
        document.querySelector('[data-effect="toggle"]')?.addEventListener('click', () => {
          document.body.classList.toggle('reduced-effects');
          const isReduced = document.body.classList.contains('reduced-effects');
          localStorage.setItem('nexus-reduced-effects', String(isReduced));
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
     <div class="menu-item" data-sound="mechanical">Sonido Mecánico: <span id="sound-status">Activado</span></div>
     <div class="text-sm text-terminal-dim mt-2">Los sonidos se reproducen en navegadores compatibles.</div>
   </div>
 </div>
      `);
      break;
    case 'reset':
      localStorage.removeItem('nexus-theme');
      localStorage.removeItem('nexus-reduced-effects');
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
       <div class="menu-item" data-config="theme">Tema de Color</div>
       <div class="menu-item" data-config="effects">Efectos Visuales</div>
       <div class="menu-item" data-config="sound">Sonido de Teclas</div>
       <div class="menu-item" data-config="reset">Restaurar Predeterminados</div>
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

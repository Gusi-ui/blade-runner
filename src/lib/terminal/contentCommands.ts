import { profile } from '../../data/profile';
import { featuredProjects } from '../../data/projects';
import { ALAMIA_URL, services } from '../../data/services';
import type { CommandSpec } from './registry';
import { escapeHtml, safeUrl } from './sanitize';

// Comandos que muestran el contenido de la página (src/data) dentro de la terminal.

const projectsHtml = (): string =>
  `<div class="section-title">Webs en producción</div><ul class="grid gap-2">${featuredProjects()
    .map(
      p => `<li class="rounded-xl border border-terminal-dim p-3">
        ${p.label ? `<span class="text-accent text-xs">${escapeHtml(p.label)} · </span>` : ''}
        <a href="${safeUrl(p.url)}" target="_blank" rel="noopener" class="text-terminal-bright font-semibold">${escapeHtml(p.name)} ↗</a>
        <div class="text-terminal-dim text-sm">${escapeHtml(p.summary)}</div>
      </li>`
    )
    .join('')}</ul>`;

const aboutHtml = (): string =>
  `<div class="section-title">Hola, soy ${escapeHtml(profile.name)}</div>${profile.about
    .map(p => `<p class="mb-2">${escapeHtml(p)}</p>`)
    .join('')}<ol class="mt-3 grid gap-2">${services
    .map(
      (s, i) => `<li>
        <span class="text-accent">${String(i + 1).padStart(2, '0')}</span>
        <span class="text-terminal-bright">${escapeHtml(s.title)}</span> —
        <span class="text-terminal-bright">${escapeHtml(s.price)}</span>
        <span class="text-terminal-dim">${escapeHtml(s.priceNote)}</span>
        <div class="text-terminal-dim text-sm">${escapeHtml(s.description)}</div>
      </li>`
    )
    .join(
      ''
    )}</ol><div class="mt-3 text-sm">Tarifas cerradas: <a href="${safeUrl(ALAMIA_URL)}" target="_blank" rel="noopener" class="text-accent underline">contratar en alamia.es ↗</a> · Proyectos a medida: comando <span class="text-accent">contacto</span></div>`;

/** Cierra la terminal y lleva al formulario de contacto de la página. */
const goToContact = (): void => {
  // Tras cerrar, la capa restaura el scroll anterior; el evento 'close' del
  // <dialog> llega después, así que el salto al formulario no se pisa.
  document
    .getElementById('terminal-sheet')
    ?.addEventListener('close', () => document.getElementById('contacto')?.scrollIntoView(), {
      once: true,
    });
  window.terminalSheet?.close();
};

export const buildContentCommands = (): CommandSpec[] => [
  {
    name: 'proyectos',
    aliases: ['projects', '3'],
    description: 'Webs en producción',
    group: 'featured',
    handler: (_args, ctx) => ctx.print(projectsHtml()),
  },
  {
    name: 'sobre-mi',
    aliases: ['cv', 'resume', 'curriculum', 'about', '2'],
    description: 'Quién soy, servicios y tarifas',
    group: 'featured',
    handler: (_args, ctx) => ctx.print(aboutHtml()),
  },
  {
    name: 'contacto',
    aliases: ['contact'],
    description: 'Ir al formulario de contacto',
    group: 'featured',
    handler: () => goToContact(),
  },
];

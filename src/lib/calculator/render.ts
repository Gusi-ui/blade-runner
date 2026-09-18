import type { TechNewsEvent } from '../../data/techEvents';
import type { APODData } from '../api/client';
import { escapeHtml, safeUrl } from '../terminal/sanitize';
import type { PlanetaryAge } from '../terminal/planetaryAge';
import { formatDecimalAge, formatHumanAge } from './humanAge';
import { moonPhaseFor, skyDataFor } from './sky';
import { zodiacSign } from './zodiac';

// HTML de los resultados de la calculadora cósmica. Funciones puras: todo texto
// externo pasa por escapeHtml y toda URL por safeUrl.

const CARD = 'mt-4 rounded-xl border border-terminal-dim p-4';
const TITLE = 'mb-3 font-sans text-base font-semibold text-terminal-bright';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const fact = (label: string, value: string): string =>
  `<div class="border-l-2 border-terminal-dim pl-3"><div class="text-terminal-dim text-xs">${label}</div><div>${value}</div></div>`;

export const EVENTS_SLOT_ID = 'calc-events';
export const SOLAR_CANVAS_ID = 'calc-solar';

export const renderResults = (
  ages: PlanetaryAge[],
  birthDate: Date,
  daysPassed: number
): string => `
  <div class="${CARD}">
    <div class="${TITLE}">Tu edad en el sistema solar</div>
    <div class="mb-4 grid gap-1 text-sm">
      <div>Edad terrestre: <span class="text-terminal-bright">${formatHumanAge(birthDate)}</span></div>
      <div>Días vividos: <span class="text-terminal-bright">${daysPassed.toLocaleString('es-ES')}</span></div>
      <div>Signo: <span class="text-terminal-bright">${zodiacSign(birthDate.getMonth(), birthDate.getDate())}</span></div>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      ${ages
        .map(
          ({ planet, age, orbitalPeriod }) => `
        <div class="border-l-2 border-terminal-dim pl-3">
          <div class="text-terminal-bright font-semibold">${planet}</div>
          <div>${formatDecimalAge(age)}</div>
          <div class="text-terminal-dim text-xs">1 año = ${orbitalPeriod.toFixed(0)} días terrestres</div>
        </div>`
        )
        .join('')}
    </div>
  </div>
  <div id="${EVENTS_SLOT_ID}" class="${CARD}">
    <div class="${TITLE}">Tecnología y ciencia cuando naciste</div>
    <div class="loading-dots text-sm">Buscando efemérides</div>
  </div>`;

export const renderEvents = (events: TechNewsEvent[], year: number, month: number): string => `
  <div class="${TITLE}">Tecnología y ciencia cuando naciste</div>
  <div class="text-terminal-dim mb-3 text-xs">Eventos cercanos a ${MONTHS[month - 1]} de ${year}</div>
  <ol class="grid gap-3">
    ${events
      .map(
        e => `
      <li class="border-l-2 border-terminal-dim pl-3">
        <div class="text-terminal-bright font-semibold">${escapeHtml(e.title)}</div>
        <div class="text-sm">${escapeHtml(e.description)}</div>
        <div class="text-terminal-dim mt-1 text-xs">${escapeHtml(e.source)}${
          e.url
            ? ` · <a href="${safeUrl(e.url)}" target="_blank" rel="noopener noreferrer" class="underline">Ver más</a>`
            : ''
        }</div>
      </li>`
      )
      .join('')}
  </ol>`;

export const renderLoadingSky = (): string =>
  `<div class="${CARD}"><div class="loading-dots text-sm">Cargando datos astronómicos</div></div>`;

const longDate = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** Foto de la NASA del día de nacimiento (título y explicación ya traducidos). */
export const renderApod = (data: APODData, title: string, explanation: string): string => `
  <div class="${CARD}">
    <div class="${TITLE}">La foto de la NASA del día que naciste</div>
    <div class="text-terminal-bright font-semibold">${escapeHtml(title)}</div>
    <div class="text-terminal-dim mb-3 text-xs">${longDate(data.date)}</div>
    ${
      data.media_type === 'image'
        ? `<img data-apod-img src="${safeUrl(data.url)}" alt="${escapeHtml(title)}" class="mb-2 w-full rounded-xl" />
           <div data-apod-error hidden class="text-terminal-dim text-sm">No se pudo cargar la imagen.</div>`
        : ''
    }
    <a href="${safeUrl(data.url)}" target="_blank" rel="noopener noreferrer" class="text-accent text-sm underline">Ver en la NASA</a>
    <p class="mt-3 text-sm leading-relaxed">${escapeHtml(explanation)}</p>
  </div>`;

/** Sin foto de la NASA (antes de 1995 o sin servicio): datos calculados y sistema solar. */
export const renderAlternative = (birthDate: Date): string => {
  const [y, m, d] = [birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate()];
  const sky = skyDataFor(m);
  const daysAlive = Math.floor((Date.now() - birthDate.getTime()) / 86_400_000);
  return `
  <div class="${CARD}">
    <div class="${TITLE}">El cielo del día que naciste</div>
    <p class="text-terminal-dim mb-3 text-xs">La NASA publica su foto diaria desde el 16 de junio de 1995: te mostramos datos calculados.</p>
    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      ${fact('Fase lunar aproximada', moonPhaseFor(y, m, d))}
      ${fact('Signo zodiacal', zodiacSign(m, d))}
      ${fact('Constelación visible', sky.constellation)}
      ${fact('Estación del año', sky.season)}
    </div>
    <p class="mb-3 text-sm">🌌 ${sky.fact}</p>
    <ul class="mb-4 grid gap-1 text-sm">
      <li>• Has dado <span class="text-terminal-bright">${(daysAlive / 365.25).toFixed(2)}</span> vueltas al Sol</li>
      <li>• La Tierra ha recorrido <span class="text-terminal-bright">${(daysAlive * 2.574).toFixed(0)}</span> millones de km en tu vida</li>
    </ul>
    <canvas id="${SOLAR_CANVAS_ID}" class="game-canvas" width="400" height="400" aria-label="Sistema solar animado (simulado)"></canvas>
  </div>`;
};

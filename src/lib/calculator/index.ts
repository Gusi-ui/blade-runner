import { techEventsFor } from '../../data/techEvents';
import { translateBatch } from '../api/translate';
import { planetaryAgesFromDays } from '../terminal/planetaryAge';
import type { TerminalController } from '../../types/terminal';
import { fetchBirthDayApod, fetchOnThisDay, filterTechEvents } from './birthDay';
import {
  EVENTS_SLOT_ID,
  renderAlternative,
  renderApod,
  renderEvents,
  renderLoadingSky,
  renderResults,
  SOLAR_CANVAS_ID,
} from './render';
import { startSolarSystem } from './solarSystem';

// Calculadora cósmica: engancha el formulario del bloque impreso (`root`) y
// pinta edades, efemérides y la foto de la NASA del día de nacimiento.

const byId = <T extends HTMLElement>(root: ParentNode, id: string): T | null =>
  root.querySelector<T>(`#${id}`);

const showEvents = async (root: ParentNode, birthDate: Date): Promise<void> => {
  const [year, month, day] = [
    birthDate.getFullYear(),
    birthDate.getMonth() + 1,
    birthDate.getDate(),
  ];
  let events = filterTechEvents(await fetchOnThisDay(month, day), year);
  if (events.length > 0) {
    const translated = await translateBatch(events.flatMap(e => [e.title, e.description]));
    events = events.map((e, i) => ({
      ...e,
      title: translated[2 * i].text,
      description: translated[2 * i + 1].text,
    }));
  } else {
    events = techEventsFor(year);
  }
  const slot = byId(root, EVENTS_SLOT_ID);
  if (slot) slot.innerHTML = renderEvents(events, year, month);
};

const showSky = async (root: ParentNode, birthdate: string, birthDate: Date): Promise<void> => {
  const container = byId(root, 'nasa-data');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = renderLoadingSky();

  const apod = await fetchBirthDayApod(birthdate);
  if (!apod) {
    container.innerHTML = renderAlternative(birthDate);
    const canvas = byId<HTMLCanvasElement>(container, SOLAR_CANVAS_ID);
    if (canvas) startSolarSystem(canvas);
    return;
  }
  const [title, explanation] = await translateBatch([apod.title, apod.explanation]);
  container.innerHTML = renderApod(apod, title.text, explanation.text);
  const img = container.querySelector<HTMLImageElement>('[data-apod-img]');
  img?.addEventListener('error', () => {
    img.hidden = true;
    container.querySelector<HTMLElement>('[data-apod-error]')?.removeAttribute('hidden');
  });
};

export const mountCalculator = (root: ParentNode, terminal: TerminalController): void => {
  const input = byId<HTMLInputElement>(root, 'birthdate');
  const results = byId(root, 'calculator-results');

  const calculate = (): void => {
    const birthdate = input?.value ?? '';
    const birthDate = new Date(`${birthdate}T00:00:00`);
    if (!birthdate || Number.isNaN(birthDate.getTime())) {
      terminal.printOutput(
        '<div class="error-text">Por favor, introduce una fecha de nacimiento válida.</div>'
      );
      return;
    }
    if (birthDate > new Date()) {
      terminal.printOutput(
        '<div class="error-text">La fecha de nacimiento no puede ser futura.</div>'
      );
      return;
    }
    if (!results) return;

    const daysPassed = Math.floor((Date.now() - birthDate.getTime()) / 86_400_000);
    results.classList.remove('hidden');
    results.innerHTML = renderResults(planetaryAgesFromDays(daysPassed), birthDate, daysPassed);
    void showEvents(root, birthDate);
    void showSky(root, birthdate, birthDate);
  };

  byId(root, 'calculator-submit')?.addEventListener('click', calculate);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') calculate();
  });
  byId(root, 'calculator-exit')?.addEventListener('click', () => window.terminal?.run?.('help'));
};

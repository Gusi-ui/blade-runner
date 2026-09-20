import { fetchAPOD, type APODData } from '../api/client';
import { translateBatch } from '../api/translate';
import { escapeHtml, safeUrl } from '../terminal/sanitize';

// Vista «apod» de la terminal. Se instala al abrir la terminal por primera vez
// (lazy.ts): su código no se descarga con la página.
let installed = false;

export const install = (): void => {
  if (installed) return;
  installed = true;

  class APODViewer {
    private updateInterval: number = 3600000;
    private intervalId?: number;
    private overlay: HTMLElement | null = null;
    private overlayImg: HTMLImageElement | null = null;
    // Bloque concreto de la terminal donde vive ESTA instancia de la vista.
    // Cada invocación de `apod` imprime un bloque nuevo (con ids repetidos):
    // hay que consultar dentro de él, no con getElementById global (devolvía
    // siempre el primero/antiguo → la 2ª petición "no aparecía").
    private root: HTMLElement | null = null;
    // Descarta resultados de cargas anteriores (p. ej. pulsar «Aleatoria» dos veces).
    private loadId = 0;

    setRoot(el: HTMLElement | null): void {
      this.root = el;
    }

    private content(): HTMLElement | null {
      return (this.root ?? document).querySelector('#apod-content');
    }

    constructor() {
      this.overlay = document.getElementById('apod-fullscreen-overlay');
      this.overlayImg = document.getElementById('apod-fullscreen-img') as HTMLImageElement | null;

      document.getElementById('apod-fullscreen-close')?.addEventListener('click', () => {
        this.closeFullscreen();
      });

      this.overlay?.addEventListener('click', e => {
        if (e.target === this.overlay) this.closeFullscreen();
      });

      // Esc cierra primero el visor; preventDefault evita que el <dialog> de la
      // terminal también se cierre con la misma pulsación.
      document.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || this.overlay?.classList.contains('hidden')) return;
        e.preventDefault();
        this.closeFullscreen();
      });

      document.addEventListener('click', e => {
        const target = e.target;
        if (!(target instanceof HTMLImageElement) || !target.classList.contains('apod-image'))
          return;
        this.openFullscreen(target.src, target.alt);
      });
    }

    private openFullscreen(src: string, alt: string): void {
      if (!this.overlay || !this.overlayImg || !src) return;

      this.overlayImg.src = src;
      this.overlayImg.alt = alt;
      this.overlay.classList.remove('hidden');
      this.overlay.classList.add('flex');
      document.body.style.overflow = 'hidden';
      this.overlay.focus();
    }

    private closeFullscreen(): void {
      if (!this.overlay || !this.overlayImg) return;
      if (this.overlay.classList.contains('hidden')) return;

      this.overlay.classList.add('hidden');
      this.overlay.classList.remove('flex');
      this.overlayImg.src = '';
      document.body.style.overflow = '';
    }

    async fetchAPOD(options: { date?: string; random?: boolean } = {}): Promise<void> {
      const apodContent = this.content();
      if (!apodContent) return;

      apodContent.innerHTML = '<div class="loading-dots">Cargando imagen astronómica</div>';
      const id = ++this.loadId;

      let data: APODData;
      try {
        data = await fetchAPOD(options);
      } catch (error) {
        console.error('Error fetching APOD:', error);
        if (id === this.loadId) this.displayError();
        return;
      }
      if (id !== this.loadId) return;

      // Se muestra ya en inglés y la traducción sustituye el texto al llegar:
      // antes la vista esperaba a traducir y podía quedarse >20 s en «Cargando».
      this.displayAPOD(data);
      this.updateLastUpdateTime();
      await this.translateAPOD(data, id);
    }

    private async translateAPOD(data: APODData, id: number): Promise<void> {
      const [title, explanation] = await translateBatch([data.title, data.explanation]);
      const content = this.content();
      if (id !== this.loadId || !content) return;

      const set = (selector: string, text: string) => {
        const el = content.querySelector(selector);
        if (el) el.textContent = text;
      };
      set('.apod-title', title.text);
      set('.apod-explanation', explanation.text);
      content.querySelector('.apod-image')?.setAttribute('alt', title.text);
      set(
        '.apod-translation-note',
        title.translated && explanation.translated
          ? ''
          : '[Traducción automática no disponible — texto en inglés]'
      );
    }

    private displayAPOD(data: APODData): void {
      const apodContent = this.content();
      if (!apodContent) return;

      const translatedTitle = data.title;
      const translatedExplanation = data.explanation;
      const translationNote =
        '<div class="apod-translation-note text-xs text-terminal-dim mt-2">Traduciendo al español…</div>';

      let html = `
        <div class="border border-terminal-bright p-4 rounded">
          <div class="mb-4">
            <div class="apod-title text-terminal-bright text-xl font-bold mb-2">
              ${escapeHtml(translatedTitle)}
            </div>
            <div class="text-sm text-terminal-dim">
              ${this.formatDate(data.date)}
              ${data.copyright ? `<span class="ml-2">© ${escapeHtml(data.copyright)}</span>` : ''}
            </div>
          </div>
      `;

      if (data.media_type === 'image') {
        const imageUrl = data.hdurl || data.url;
        html += `
          <div class="mb-4">
            <div class="relative">
              <img
                src="${safeUrl(imageUrl)}"
                alt="${escapeHtml(translatedTitle)}"
                class="apod-image block w-full border-2 border-terminal-dim rounded hover:border-terminal-bright transition-colors cursor-zoom-in"
                style="display: block; height: auto;"
                loading="lazy"
                title="Clic para ver a pantalla completa"
              />
              <div style="display:none;" class="text-terminal-dim text-center p-4 border border-terminal-dim rounded">
                ⚠️ Error al cargar la imagen. <a href="${safeUrl(data.url)}" target="_blank" rel="noopener noreferrer" class="text-terminal-bright hover:underline">Abrir imagen original →</a>
              </div>
            </div>
            <div class="text-center text-xs text-terminal-dim mt-2 space-y-1">
              <p>🖱️ Clic en la imagen para pantalla completa</p>
              <a href="${safeUrl(data.hdurl || data.url)}" target="_blank" rel="noopener noreferrer" class="text-terminal-text hover:text-terminal-bright">
                🔗 Abrir imagen original en nueva pestaña
              </a>
            </div>
          </div>
        `;
      } else if (data.media_type === 'video') {
        html += `
          <div class="mb-4">
            <div class="aspect-video w-full border-2 border-terminal-dim rounded overflow-hidden">
              <iframe
                src="${safeUrl(data.url)}"
                class="w-full h-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        `;
      }

      html += `
          <div class="mt-4">
            <div class="text-terminal-bright font-semibold mb-2 text-base">📖 Explicación:</div>
            <div class="apod-explanation text-base leading-relaxed">
              ${escapeHtml(translatedExplanation)}
            </div>
          </div>

          ${translationNote}
          <div class="mt-4 p-3 bg-black/30 rounded border border-terminal-dim">
            <div class="text-terminal-dim text-xs">
              <strong>Título original:</strong> ${escapeHtml(data.title)}
            </div>
          </div>
        </div>
      `;

      apodContent.innerHTML = html;

      // Los avisos de carga van aquí y no en atributos onload/onerror: la CSP
      // bloquea el JavaScript escrito dentro del HTML.
      const image = apodContent.querySelector<HTMLImageElement>('.apod-image');
      if (image) {
        const fallback = image.nextElementSibling;
        const onLoad = (): void => {
          image.style.opacity = '1';
          image.classList.add('loaded');
        };
        image.addEventListener('load', onLoad);
        image.addEventListener('error', () => {
          image.style.display = 'none';
          if (fallback instanceof HTMLElement) fallback.style.display = 'block';
        });
        if (image.complete && image.naturalWidth > 0) onLoad();
      }
    }

    private displayError(): void {
      const apodContent = this.content();
      if (!apodContent) return;

      const nasaKey = import.meta.env.PUBLIC_NASA_API_KEY || 'DEMO_KEY';
      const isDemoKey = nasaKey === 'DEMO_KEY' || nasaKey === 'tu_clave_real_de_nasa_aqui';
      const hasWorker = !!import.meta.env.PUBLIC_API_BASE_URL;

      if (isDemoKey && !hasWorker) {
        apodContent.innerHTML = `
          <div class="border border-terminal-dim p-4 rounded">
            <div class="error-text mb-4">⚠️ Clave API de NASA requerida</div>
            <div class="text-terminal-text">
              <p class="mb-2">Para ver la imagen astronómica del día real necesitas:</p>
              <ol class="ml-4 list-decimal space-y-1">
                <li>Obtener una clave API gratuita en <a href="https://api.nasa.gov/" target="_blank" class="text-terminal-bright hover:underline">api.nasa.gov</a></li>
                <li>Crear un archivo .env en la raíz del proyecto</li>
                <li>Agregar: <code class="text-terminal-bright">PUBLIC_NASA_API_KEY=tu_clave_aqui</code></li>
              </ol>
              <div class="mt-4 p-3 bg-black/30 rounded border border-terminal-dim">
                <p class="text-terminal-bright mb-2">💡 Ejemplo de imagen astronómica:</p>
                <p class="text-sm">Cada día, la NASA publica una imagen diferente del universo junto con una explicación escrita por un astrónomo profesional.</p>
              </div>
            </div>
          </div>
        `;
      } else {
        apodContent.innerHTML = `
          <div class="error-text">Error al cargar la imagen astronómica.</div>
          <div class="mt-4 text-terminal-dim">
            <p>Verifica tu conexión a internet y tu clave API de NASA.</p>
            <p class="mt-2">Puedes obtener una clave gratuita en <a href="https://api.nasa.gov/" target="_blank" class="text-terminal-text hover:text-terminal-bright underline">api.nasa.gov</a></p>
          </div>
        `;
      }
    }

    private formatDate(dateString: string): string {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    private updateLastUpdateTime(): void {
      const lastUpdate = (this.root ?? document).querySelector('#apod-last-update');
      if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `Última actualización: ${now.toLocaleTimeString('es-ES')}`;
      }
    }

    startAutoUpdate(initial: { date?: string; random?: boolean } = {}): void {
      this.fetchAPOD(initial);

      // El refresco horario siempre vuelve a la imagen del día
      this.intervalId = window.setInterval(() => {
        this.fetchAPOD();
      }, this.updateInterval);
    }

    stopAutoUpdate(): void {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    }

    refreshAPOD(): void {
      this.fetchAPOD();
    }

    randomAPOD(): void {
      this.fetchAPOD({ random: true });
    }
  }

  const apodViewer = new APODViewer();
  window.apodViewer = apodViewer;

  document.addEventListener('loadView', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail.view === 'apod') {
      const terminal = window.terminal;
      const apodComponent = document.getElementById('apod-component');

      if (terminal && apodComponent) {
        apodViewer.stopAutoUpdate();
        terminal.printOutput(apodComponent.innerHTML);

        // Acotar la instancia al bloque recién impreso (el último .terminal-output).
        const blocks = document.querySelectorAll('#output-container .terminal-output');
        const root = blocks[blocks.length - 1] as HTMLElement | undefined;
        apodViewer.setRoot(root ?? null);

        // Argumentos del comando: 'apod random' o 'apod YYYY-MM-DD'
        const arg = (customEvent.detail.args?.[0] as string | undefined) ?? '';
        const initial = arg === 'random' ? { random: true } : arg ? { date: arg } : {};
        apodViewer.startAutoUpdate(initial);

        if (root) {
          root
            .querySelector('#apod-refresh')
            ?.addEventListener('click', () => apodViewer.refreshAPOD());
          root
            .querySelector('#apod-random')
            ?.addEventListener('click', () => apodViewer.randomAPOD());
        }
      }
    } else {
      apodViewer.stopAutoUpdate();
    }
  });
};

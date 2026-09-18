import { addMessage, getHistory } from '../ai/conversation';
import { streamChat } from '../ai/stream';

// Vista «chat» de la terminal. Se instala al abrir la terminal por primera vez
// (lazy.ts): su código no se descarga con la página.
let installed = false;

export const install = (): void => {
  if (installed) return;
  installed = true;

  class ChatAssistant {
    private messages: HTMLElement;
    private status: HTMLElement;
    private input: HTMLInputElement;
    private isStreaming = false;

    constructor(root: HTMLElement) {
      this.messages = root.querySelector('.chat-messages') as HTMLElement;
      this.status = root.querySelector('.chat-status') as HTMLElement;
      this.input = root.querySelector('.chat-input') as HTMLInputElement;

      root.querySelector('.chat-send')?.addEventListener('click', () => this.handleSend());
      this.input.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.handleSend();
      });

      // Repintar la conversación previa (compartida con el comando 'ask')
      for (const msg of getHistory()) {
        this.appendMessage(msg.role, msg.content);
      }
      if (getHistory().length === 0) {
        this.appendMessage(
          'assistant',
          'Sistema Nexus-7 online. ¿En qué puedo ayudarte? Prueba: "¿Qué proyectos tiene Gusi?" o "¿Cómo veo la foto de la NASA?"'
        );
      }
    }

    private appendMessage(role: 'user' | 'assistant', content: string): HTMLElement {
      const div = document.createElement('div');
      div.className = role === 'user' ? 'text-terminal-bright' : 'text-terminal-text';
      const label = document.createElement('span');
      label.className = 'text-terminal-dim';
      label.textContent = role === 'user' ? 'Tú: ' : 'Nexus-7: ';
      const body = document.createElement('span');
      body.textContent = content;
      div.append(label, body);
      this.messages.appendChild(div);
      this.messages.scrollTop = this.messages.scrollHeight;
      return body;
    }

    private setStatus(text: string): void {
      this.status.textContent = text;
    }

    private async handleSend(): Promise<void> {
      if (this.isStreaming) return;

      const message = this.input.value.trim();
      if (!message) return;

      this.input.value = '';
      this.appendMessage('user', message);
      addMessage('user', message);
      this.isStreaming = true;
      this.setStatus('Procesando...');

      const answerEl = this.appendMessage('assistant', '');

      try {
        const text = await streamChat(message, getHistory().slice(0, -1), token => {
          answerEl.textContent += token;
          this.messages.scrollTop = this.messages.scrollHeight;
        });
        if (text) addMessage('assistant', text);
        else answerEl.textContent = 'Sin respuesta.';
        this.setStatus('');
      } catch (error) {
        const apiBase = import.meta.env.PUBLIC_API_BASE_URL;
        answerEl.textContent = apiBase
          ? 'Error al conectar con el asistente. Verifica que el Worker esté desplegado.'
          : 'El asistente requiere PUBLIC_API_BASE_URL. Configura el Worker de Cloudflare.';
        this.setStatus('');
        console.error('Chat error:', error);
      } finally {
        this.isStreaming = false;
      }
    }
  }

  document.addEventListener('loadView', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail.view !== 'chat') return;

    const terminal = window.terminal;
    const template = document.getElementById('chat-template') as HTMLTemplateElement | null;
    if (!terminal?.printBlock || !template) return;

    const block = terminal.printBlock();
    const instance = template.content.firstElementChild?.cloneNode(true) as HTMLElement;
    block.appendChild(instance);
    new ChatAssistant(instance);
  });
};

import type { TerminalContext } from '../terminal/registry';
import { addMessage, getHistory } from './conversation';
import { streamChat } from './stream';

// Comando inline 'ask <pregunta>': imprime la respuesta del asistente en el
// flujo de la terminal, token a token, sin abrir la vista de chat.

let activeAbort: AbortController | null = null;

/** Cancela el streaming en curso (Ctrl+C). Devuelve true si había uno activo. */
export const cancelAsk = (): boolean => {
  if (!activeAbort) return false;
  activeAbort.abort();
  activeAbort = null;
  return true;
};

export const askInline = async (question: string, ctx: TerminalContext): Promise<void> => {
  if (activeAbort) {
    ctx.printText('Ya hay una consulta en curso. Pulsa Ctrl+C para cancelarla.');
    return;
  }

  const block = ctx.printBlock();
  // Sin anuncios token a token para lectores de pantalla: se anuncia al final
  block.setAttribute('aria-live', 'off');
  const label = document.createElement('span');
  label.className = 'text-terminal-dim';
  label.textContent = 'Nexus-7: ';
  const answer = document.createElement('span');
  answer.className = 'ask-answer';
  block.append(label, answer);

  addMessage('user', question);
  activeAbort = new AbortController();

  try {
    const text = await streamChat(
      question,
      getHistory().slice(0, -1),
      token => {
        answer.textContent += token;
        ctx.scrollToBottom();
      },
      activeAbort.signal
    );
    if (text) addMessage('assistant', text);
    else answer.textContent = 'Sin respuesta del asistente.';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      answer.textContent += ' ^C';
      return;
    }
    answer.textContent =
      'El asistente no está disponible. Comprueba el estado del Worker con el comando status.';
  } finally {
    activeAbort = null;
    block.removeAttribute('aria-live');
    ctx.scrollToBottom();
  }
};

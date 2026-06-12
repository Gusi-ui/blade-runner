import { getApiBase } from '../api/client';
import type { ChatMessage } from './conversation';

/**
 * Extrae el token de texto de una línea SSE de Workers AI.
 * Tolerante a los dos formatos que emiten los modelos: `{"response": "..."}`
 * y el compatible con OpenAI (`choices[0].delta.content`).
 * Devuelve null para líneas sin token (comentarios, [DONE], keep-alives).
 */
export const tokenFromSSELine = (line: string): string | null => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === '[DONE]') return null;
  try {
    const data = JSON.parse(payload) as {
      response?: string;
      choices?: { delta?: { content?: string } }[];
    };
    const token = data.response ?? data.choices?.[0]?.delta?.content;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
};

/**
 * Envía un mensaje al asistente y consume la respuesta en streaming.
 * Llama a onToken por cada fragmento y devuelve el texto completo.
 * Si el Worker responde sin streaming (fallback), entrega el texto de una vez.
 */
export const streamChat = async (
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error('Chat requiere PUBLIC_API_BASE_URL configurada');

  const response = await fetch(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, stream: true }),
    signal,
  });
  if (!response.ok) throw new Error(`Error ${response.status}`);

  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    const data = (await response.json()) as { response?: string };
    const text = data.response ?? '';
    if (text) onToken(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const token = tokenFromSSELine(line);
      if (token) {
        fullText += token;
        onToken(token);
      }
    }
  }

  const lastToken = tokenFromSSELine(buffer);
  if (lastToken) {
    fullText += lastToken;
    onToken(lastToken);
  }

  return fullText;
};

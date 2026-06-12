// Estado de conversación compartido entre la vista de chat y el comando
// inline 'ask', para que ambos mantengan el mismo contexto con el asistente.

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_MESSAGES = 20;

const history: ChatMessage[] = [];

export const getHistory = (): ChatMessage[] => [...history];

export const addMessage = (role: ChatMessage['role'], content: string): void => {
  history.push({ role, content });
  if (history.length > MAX_MESSAGES) {
    history.splice(0, history.length - MAX_MESSAGES);
  }
};

export const resetConversation = (): void => {
  history.length = 0;
};

import { describe, expect, it } from 'vitest';
import { tokenFromSSELine } from './stream';

describe('tokenFromSSELine', () => {
  it('extrae tokens del formato de Workers AI', () => {
    expect(tokenFromSSELine('data: {"response": "Hola"}')).toBe('Hola');
    expect(tokenFromSSELine('data:{"response":" mundo"}')).toBe(' mundo');
  });

  it('extrae tokens del formato compatible con OpenAI', () => {
    expect(tokenFromSSELine('data: {"choices":[{"delta":{"content":"Bienvenido"}}]}')).toBe(
      'Bienvenido'
    );
  });

  it('ignora [DONE], comentarios y líneas vacías', () => {
    expect(tokenFromSSELine('data: [DONE]')).toBeNull();
    expect(tokenFromSSELine('')).toBeNull();
    expect(tokenFromSSELine(': keep-alive')).toBeNull();
    expect(tokenFromSSELine('event: message')).toBeNull();
  });

  it('ignora JSON malformado y tokens vacíos', () => {
    expect(tokenFromSSELine('data: {no-json')).toBeNull();
    expect(tokenFromSSELine('data: {"response": ""}')).toBeNull();
    expect(tokenFromSSELine('data: {"otra": "cosa"}')).toBeNull();
  });
});

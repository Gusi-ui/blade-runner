// Tokens que abren la terminal en una vista por hash (#apod, #news…). Lista
// literal para no descargar el registro de comandos en la página: se mantiene
// sincronizada con commands.ts (lo vigila viewTokens.test.ts).
export const VIEW_TOKENS: readonly string[] = [
  'news',
  'noticias',
  'games',
  'juegos',
  'calculator',
  'calculadora',
  'apod',
  'chat',
];

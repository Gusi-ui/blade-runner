import { getHighScore, saveScore } from '../lib/games/scores';
import type { TerminalContext } from '../lib/terminal/registry';

// "Adivina el número": juego textual jugado en el propio flujo de la
// terminal mediante el modo interactivo (InputInterceptor).

const MAX_NUMBER = 100;

const scoreFor = (attempts: number): number => Math.max(10, 110 - attempts * 10);

export const startGuessGame = (ctx: TerminalContext): void => {
  const secret = Math.floor(Math.random() * MAX_NUMBER) + 1;
  let attempts = 0;

  const best = getHighScore('guess');
  ctx.print(`
    <div class="text-terminal-bright">ADIVINA EL NÚMERO</div>
    <div class="text-sm">He pensado un número del 1 al ${MAX_NUMBER}. Escribe tu intento y pulsa Enter.</div>
    <div class="text-terminal-dim text-xs">Menos intentos = más puntos.${best ? ` Récord actual: ${best} puntos.` : ''} Ctrl+C para abandonar.</div>
  `);

  ctx.pushInputHandler({
    onInput: value => {
      const guess = parseInt(value.trim(), 10);
      if (Number.isNaN(guess) || guess < 1 || guess > MAX_NUMBER) {
        ctx.printText(`Introduce un número entre 1 y ${MAX_NUMBER}.`);
        return;
      }

      attempts++;
      if (guess < secret) {
        ctx.printText(`${guess} es demasiado bajo. Prueba con uno mayor.`);
        return;
      }
      if (guess > secret) {
        ctx.printText(`${guess} es demasiado alto. Prueba con uno menor.`);
        return;
      }

      const score = scoreFor(attempts);
      const isRecord = saveScore('guess', score);
      ctx.popInputHandler();
      ctx.print(`
        <div class="success-text">✓ ¡Correcto! Era ${secret}. Lo lograste en ${attempts} ${attempts === 1 ? 'intento' : 'intentos'} (${score} puntos).</div>
        ${isRecord ? '<div class="text-terminal-bright">★ Nuevo récord. Consúltalo con el comando scores.</div>' : ''}
      `);
    },
    onCancel: () => {
      ctx.printText(`Partida abandonada. El número era ${secret}.`);
    },
  });
};

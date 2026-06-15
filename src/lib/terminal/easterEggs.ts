import { startMatrixRain } from '../../scripts/matrixRain';
import type { CommandSpec, TerminalContext } from './registry';
import { escapeHtml } from './sanitize';

// Comandos ocultos (no salen en help ni en el autocompletado).

const TEARS_IN_RAIN = `Yo he visto cosas que vosotros no creeríais:
naves de ataque en llamas más allá de Orión.
He visto rayos C brillar en la oscuridad, cerca de la Puerta de Tannhäuser.
Todos esos momentos se perderán en el tiempo...
como lágrimas en la lluvia.

Es hora de morir.`;

const FAKE_LS = `total 2049
drwxr-xr-x  7 gusi  nexus   224 jun 12 03:33 .
drwxr-xr-x  3 root  nexus    96 nov  1  2019 ..
-rw-------  1 gusi  nexus  2049 jun 12 03:33 .recuerdos_implantados
drwxr-xr-x  2 gusi  nexus    64 ene  8  2016 fotos_de_familia
-rwxr-xr-x  1 gusi  nexus 40961 jun 12 03:33 test_voight_kampff
-rw-r--r--  1 gusi  nexus   666 jun 12 03:33 unicornio_de_origami.txt
drwx------  4 gusi  nexus   128 jun 12 03:33 replicantes_fugados`;

const CAT_FILES: Record<string, string> = {
  'unicornio_de_origami.txt': 'Es una lástima que ella muera. Pero, ¿quién vive?',
  '.recuerdos_implantados': 'Error: acceso denegado. Estos recuerdos pertenecen a otra persona.',
};

const VK_QUESTIONS = [
  'Estás en un desierto, caminando sobre la arena, cuando de repente miras hacia abajo y ves una tortuga. La pones boca arriba. La tortuga agita las patas intentando darse la vuelta, pero no puede. ¿Por qué no la ayudas?',
  'Describe, con palabras sencillas, solo las cosas buenas que te vengan a la mente acerca de... tu madre.',
  'Estás viendo una obra de teatro. Un banquete está en marcha. Los invitados disfrutan de un aperitivo de perro crudo. ¿Qué haces?',
];

const startVoightKampff = (ctx: TerminalContext): void => {
  let question = 0;
  let totalChars = 0;

  ctx.print(`
    <div class="section-title glitch" data-text="Test Voight-Kampff">Test Voight-Kampff</div>
    <div class="text-sm mb-2">Responde con sinceridad. Medimos la dilatación de tu pupila y tu respuesta empática.</div>
    <div class="text-terminal-dim text-xs mb-2">Ctrl+C para abortar el test (sospechoso).</div>
  `);
  ctx.printText(`Pregunta 1/3: ${VK_QUESTIONS[0]}`);

  ctx.pushInputHandler({
    onInput: value => {
      totalChars += value.trim().length;
      question++;
      if (question < VK_QUESTIONS.length) {
        ctx.printText(`Pregunta ${question + 1}/3: ${VK_QUESTIONS[question]}`);
        return;
      }
      ctx.popInputHandler();
      const empathic = totalChars > 60;
      ctx.print(`
        <div class="text-terminal-bright mt-2">ANÁLISIS COMPLETO.</div>
        <div>Fluctuación pupilar: ${empathic ? 'dentro de parámetros humanos' : 'anómala'}.</div>
        <div>Respuesta empática: ${empathic ? 'detectada' : 'insuficiente'}.</div>
        <div class="mt-2 ${empathic ? 'success-text' : 'error-text'}">${
          empathic
            ? 'VEREDICTO: Humano. Probablemente.'
            : 'VEREDICTO: Replicante. Un blade runner irá a buscarte en breve.'
        }</div>
      `);
    },
    onCancel: () => {
      ctx.printText('Test abortado. Esa reacción ha sido registrada, sujeto.');
    },
  });
};

export const buildEasterEggCommands = (): CommandSpec[] => [
  {
    name: 'matrix',
    aliases: ['wake up neo', 'despierta neo'],
    description: 'Sigue al conejo blanco',
    hidden: true,
    handler: () => startMatrixRain(),
  },
  {
    name: 'sudo',
    description: 'Permisos de superusuario',
    hidden: true,
    restOfLine: true,
    handler: (_args, ctx) =>
      ctx.printText('gusi is not in the sudoers file. This incident will be reported.'),
  },
  {
    name: 'voight-kampff',
    aliases: ['replicant', 'replicante'],
    description: 'Test de empatía Voight-Kampff',
    hidden: true,
    handler: (_args, ctx) => startVoightKampff(ctx),
  },
  {
    name: 'tears',
    aliases: ['tears in rain', 'lagrimas en la lluvia'],
    description: 'Monólogo de Roy Batty',
    hidden: true,
    handler: async (_args, ctx) => {
      await ctx.printTyped(TEARS_IN_RAIN, 40);
    },
  },
  {
    name: 'ls',
    aliases: ['ll', 'dir'],
    description: 'Lista el directorio',
    hidden: true,
    handler: (_args, ctx) =>
      ctx.print(`<pre class="text-sm leading-tight">${escapeHtml(FAKE_LS)}</pre>`),
  },
  {
    name: 'pwd',
    description: 'Directorio actual',
    hidden: true,
    handler: (_args, ctx) => ctx.printText('/home/gusi/nexus-7'),
  },
  {
    name: 'cat',
    description: 'Muestra un archivo',
    hidden: true,
    restOfLine: true,
    handler: (args, ctx) => {
      const file = args[0]?.trim() ?? '';
      if (!file) {
        ctx.printText('cat: falta el nombre del archivo. Prueba con ls.');
        return;
      }
      const content = CAT_FILES[file];
      ctx.printText(content ?? `cat: ${file}: No existe el archivo (¿o nunca existió?)`);
    },
  },
];

/** Código Konami: ↑↑↓↓←→←→BA dispara la lluvia Matrix. */
export const installKonamiListener = (): void => {
  const SEQUENCE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  let progress = 0;
  document.addEventListener('keydown', e => {
    progress = e.key === SEQUENCE[progress] ? progress + 1 : e.key === SEQUENCE[0] ? 1 : 0;
    if (progress === SEQUENCE.length) {
      progress = 0;
      startMatrixRain();
    }
  });
};

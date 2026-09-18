// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { buildLiveScript, renderLive } from './liveTerminal';

describe('terminal viva', () => {
  it('el guion usa los datos reales', () => {
    const script = buildLiveScript(
      { name: 'Gusi', role: 'Full Stack', terminalStack: ['astro', 'ts'] },
      4
    );
    expect(script.map(l => l.cmd)).toEqual(['whoami', 'stack', 'proyectos --count']);
    expect(script[0].out).toBe('Gusi · Full Stack');
    expect(script[1].out).toBe('astro · ts');
    expect(script[2].out).toBe('4 webs en producción');
  });

  it('en modo instantáneo pinta todo sin esperar', async () => {
    const el = document.createElement('div');
    await renderLive(el, [{ cmd: 'whoami', out: 'Gusi' }], { instant: true });
    expect(el.textContent).toContain('$ whoami');
    expect(el.textContent).toContain('Gusi');
  });
});

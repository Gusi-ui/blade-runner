// Terminal «viva» del Hero: escribe unos comandos de demostración.
// Con prefers-reduced-motion se muestra ya escrita (spec §3).

export interface LiveLine {
  cmd: string;
  out: string;
}

export const buildLiveScript = (
  p: { name: string; role: string; terminalStack: string[] },
  projectCount: number
): LiveLine[] => [
  { cmd: 'whoami', out: `${p.name} · ${p.role}` },
  { cmd: 'stack', out: p.terminalStack.join(' · ') },
  { cmd: 'proyectos --count', out: `${projectCount} webs en producción` },
];

const wait = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

const line = (el: HTMLElement, cls: string, text: string): HTMLElement => {
  const div = document.createElement('span');
  div.className = `${cls} block`;
  div.textContent = text;
  el.appendChild(div);
  return div;
};

export const renderLive = async (
  el: HTMLElement,
  script: LiveLine[],
  opts: { instant: boolean }
): Promise<void> => {
  el.textContent = '';
  for (const { cmd, out } of script) {
    const prompt = line(el, 'live-cmd', '$ ');
    if (opts.instant) prompt.textContent = `$ ${cmd}`;
    else
      for (const ch of cmd) {
        prompt.textContent += ch;
        await wait(55);
      }
    if (!opts.instant) await wait(250);
    line(el, 'live-out text-strong', out);
  }
  line(el, 'live-cursor live-cmd', '$ ');
};

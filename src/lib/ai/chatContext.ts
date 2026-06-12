// El system prompt del asistente vive en el Worker (workers/src/index.ts),
// que es la única fuente de verdad. Aquí solo queda contenido del frontend.

export const CONTACT_HTML = `
<div class="section-title">Contacto</div>
<div class="border border-terminal-dim p-4 rounded space-y-2">
  <div><span class="text-terminal-bright">Email:</span> webmaster@gusi.dev</div>
  <div><span class="text-terminal-bright">GitHub:</span> <a href="https://github.com/Gusi-ui" target="_blank" rel="noopener noreferrer" class="text-terminal-text hover:text-terminal-bright underline">github.com/Gusi-ui</a></div>
  <div><span class="text-terminal-bright">Web:</span> <a href="https://gusi.dev" target="_blank" rel="noopener noreferrer" class="text-terminal-text hover:text-terminal-bright underline">gusi.dev</a></div>
</div>`;

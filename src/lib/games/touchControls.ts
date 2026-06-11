export const renderTouchControls = (
  containerId: string,
  actions: { label: string; action: string; wide?: boolean }[]
): void => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = `
    <div class="touch-controls" role="group" aria-label="Controles táctiles">
      ${actions
        .map(
          a => `
        <button type="button" class="touch-btn ${a.wide ? 'touch-btn-wide' : ''}" data-touch-action="${a.action}" aria-label="${a.label}">
          ${a.label}
        </button>`
        )
        .join('')}
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
};

export const bindTouchControls = (
  onAction: (action: string) => void,
  root: ParentNode = document
): void => {
  root.querySelectorAll('[data-touch-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-touch-action');
      if (action) onAction(action);
    });
  });
};

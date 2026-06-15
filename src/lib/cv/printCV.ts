// Descarga del CV en PDF mediante el diálogo de impresión del navegador
// ("Guardar como PDF"). Aísla #cv-component con la clase body.print-cv,
// que el CSS de impresión usa para mostrar solo el CV en blanco y negro.

export const printCV = (): void => {
  document.body.classList.add('print-cv');
  const cleanup = (): void => {
    document.body.classList.remove('print-cv');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
};

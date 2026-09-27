document.addEventListener('DOMContentLoaded', () => {
  // Duplica automáticamente las tarjetas de cada fila para lograr el loop continuo infinitamente
  document.querySelectorAll('.bg-row').forEach(row => {
    row.innerHTML = row.innerHTML.repeat(4);
  });

  const loginForm = document.querySelector('.login-form');
  const submitBtn = document.querySelector('.btn-submit');

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Evita el refresco de página

      // Deshabilita el botón para evitar múltiples envíos
      submitBtn.disabled = true;

      // Dispara la animación CSS de salida
      submitBtn.classList.add('btn-submit--success');

      // Redirecciona al finalizar la animación
      submitBtn.addEventListener('animationend', function handleAnimationEnd() {
        submitBtn.removeEventListener('animationend', handleAnimationEnd);
        window.location.href = 'index.html';
      });
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  // Duplica automáticamente las tarjetas de cada fila para lograr el loop continuo
  document.querySelectorAll('.bg-row').forEach(row => {
    row.innerHTML = row.innerHTML.repeat(4);
  });

  const loginForm = document.querySelector('.login-form');
  const submitBtn = document.getElementById('btnSubmit');

  if (loginForm && submitBtn) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // 1. Inicia animación de carga
      submitBtn.classList.add('is-loading');

      // 2. Transición a estado de éxito tras simular validación
      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.classList.add('is-success');

        // 3. Redirección al finalizar
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 700);

      }, 1200);
    });
  }
});
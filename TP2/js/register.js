document.addEventListener('DOMContentLoaded', () => {
  // Duplica automáticamente las tarjetas de cada fila
  document.querySelectorAll('.bg-row').forEach(row => {
    row.innerHTML = row.innerHTML.repeat(4);
  });

  const registerForm = document.querySelector('.register-form');
  const submitBtn = document.getElementById('btnSubmit');

  if (registerForm && submitBtn) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // 1. Inicia animación de carga
      submitBtn.classList.add('is-loading');

      // 2. Transición a estado de éxito
      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.classList.add('is-success');

        // 3. Redirección a Login
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 700);

      }, 1200);
    });
  }
});
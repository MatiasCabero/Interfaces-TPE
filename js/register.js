document.addEventListener('DOMContentLoaded', () => {
  // Duplica automáticamente las tarjetas de cada fila para lograr el loop continuo infinitamente
  document.querySelectorAll('.bg-row').forEach(row => {
    row.innerHTML = row.innerHTML.repeat(4);
  });

  const registerForm = document.querySelector('.register-form');
  const submitBtn = document.querySelector('.btn-submit');

  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // Deshabilitar botón durante el proceso
      submitBtn.disabled = true;

      // Animación de salida deslizable
      submitBtn.classList.add('btn-submit--success');

      // Redirección al finalizar la animación
      submitBtn.addEventListener('animationend', function handleAnimationEnd() {
        submitBtn.removeEventListener('animationend', handleAnimationEnd);
        window.location.href = 'login.html';
      });
    });
  }
});
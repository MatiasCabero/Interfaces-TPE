// =========================================================
// LÓGICA DE LA PÁGINA DE DETALLE DE JUEGO
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------
  // 1. BOTÓN Y REPRODUCTOR DE VIDEO
  // -------------------------------------------------------
  const videoPlayBtn = document.getElementById('videoPlayBtn');
  const videoPlaceholderText = document.getElementById('videoPlaceholderText');

  if (videoPlayBtn && videoPlaceholderText) {
    videoPlayBtn.addEventListener('click', () => {
      videoPlaceholderText.textContent = 'Reproduciendo simulación...';
      videoPlayBtn.style.display = 'none';
    });
  }

  // -------------------------------------------------------
  // 2. ANIMACIÓN DE PUBLICACIÓN (TRANSFORMACIÓN EN CARTA)
  // -------------------------------------------------------
  const commentForm = document.getElementById('commentForm');
  const btnPublicar = document.getElementById('btnPublicar');

  if (commentForm && btnPublicar) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault(); // EVITA EL REFRESCO DE PÁGINA

      // ACTIVAR TRANSFORMACIÓN
      btnPublicar.classList.add('is-sent');

      // REGRESAR AL ESTADO INICIAL AL SEGUNDO
      setTimeout(() => {
        btnPublicar.classList.remove('is-sent');
        commentForm.reset();
      }, 1000);
    });
  }

});
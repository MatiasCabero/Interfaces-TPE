// =========================================================
// LÓGICA DE LA PÁGINA DE DETALLE DE JUEGO
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------
    // BOTÓN Y REPRODUCTOR DE VIDEO
    // -------------------------------------------------------
    const videoPlayBtn = document.getElementById('videoPlayBtn');
    const videoPlaceholderText = document.getElementById('videoPlaceholderText');
  
    if (videoPlayBtn && videoPlaceholderText) {
      videoPlayBtn.addEventListener('click', () => {
        videoPlaceholderText.textContent = 'Reproduciendo simulación...';
        videoPlayBtn.style.display = 'none';
      });
    }
  
  });
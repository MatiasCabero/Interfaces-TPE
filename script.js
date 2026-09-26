// =========================================================
// LÓGICA DE INTERACCIÓN Y NAVEGACIÓN GLOBAL EN JS
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------
  // 1. LOADER SIMULADO DE 5 SEGUNDOS (OBLIGATORIO PUNTO 3)
  // -------------------------------------------------------
  const loaderPercent = document.getElementById('loaderPercent');
  const loaderScreen = document.getElementById('loaderScreen');

  if (loaderPercent && loaderScreen) {
    let progress = 0;

    // Sube de a 2% cada 100ms (5000ms = 5 segundos exactos)
    const interval = setInterval(() => {
      progress += 2;
      loaderPercent.textContent = `${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        // Fade out suave para revelar la página
        loaderScreen.style.opacity = '0';
        loaderScreen.style.transition = 'opacity 0.4s ease';
        setTimeout(() => {
          loaderScreen.style.display = 'none';
        }, 400);
      }
    }, 100);
  }


  // -------------------------------------------------------
  // 2. CONTROL DE MENÚS DESPLEGABLES (LATERAL Y USUARIO)
  // -------------------------------------------------------
  const btnOpenMenu = document.getElementById('btnOpenMenu');
  const btnCloseMenu = document.getElementById('btnCloseMenu');
  const sideMenu = document.getElementById('sideMenu');

  const btnOpenUserMenu = document.getElementById('btnOpenUserMenu');
  const btnCloseUserMenu = document.getElementById('btnCloseUserMenu');
  const userMenu = document.getElementById('userMenu');

  const backdropOverlay = document.getElementById('backdropOverlay');

  // Abrir / Cerrar Menú Lateral
  if (btnOpenMenu && sideMenu && backdropOverlay) {
    btnOpenMenu.addEventListener('click', () => {
      sideMenu.classList.add('active');
      backdropOverlay.classList.add('active');
    });
  }

  const closeSideMenu = () => {
    if (sideMenu && backdropOverlay) {
      sideMenu.classList.remove('active');
      backdropOverlay.classList.remove('active');
    }
  };

  if (btnCloseMenu) {
    btnCloseMenu.addEventListener('click', closeSideMenu);
  }

  // Abrir / Cerrar Menú Usuario
  if (btnOpenUserMenu && userMenu) {
    btnOpenUserMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('active');
    });
  }

  if (btnCloseUserMenu && userMenu) {
    btnCloseUserMenu.addEventListener('click', () => {
      userMenu.classList.remove('active');
    });
  }

  // Cerrar menús al hacer clic fuera (en el fondo oscuro)
  if (backdropOverlay) {
    backdropOverlay.addEventListener('click', () => {
      closeSideMenu();
      if (userMenu) userMenu.classList.remove('active');
    });
  }


  // -------------------------------------------------------
  // 3. ANIMACIÓN Y TRANSICIÓN FLUIDA SIMULTÁNEA EN EL HERO (3D)
  // -------------------------------------------------------
  const heroLeftArrow = document.getElementById('heroLeftArrow');
  const heroRightArrow = document.getElementById('heroRightArrow');

  if (heroLeftArrow && heroRightArrow) {
    
    // Lista de clases de posición en orden circular
    let positions = ['pos-left', 'pos-center', 'pos-right'];

    function updatePositions() {
      const cards = document.querySelectorAll('.hero-card');
      cards.forEach((card, index) => {
        // Remueve posiciones anteriores
        card.classList.remove('pos-left', 'pos-center', 'pos-right');
        // Asigna la nueva clase que activa la animación CSS
        card.classList.add(positions[index]);
      });
    }

    // Al presionar FLECHA DERECHA:
    // La card de la Derecha pasa al Centro, la del Centro a la Izquierda y la Izquierda va a la Derecha.
    heroRightArrow.addEventListener('click', () => {
      positions.unshift(positions.pop());
      updatePositions();
    });

    // Al presionar FLECHA IZQUIERDA:
    // La card de la Izquierda pasa al Centro, la del Centro a la Derecha y la Derecha va a la Izquierda.
    heroLeftArrow.addEventListener('click', () => {
      positions.push(positions.shift());
      updatePositions();
    });
  }


  // -------------------------------------------------------
  // 4. DESPLAZAMIENTO HORIZONTAL DE LAS CATEGORÍAS
  // -------------------------------------------------------
  const categoryBlocks = document.querySelectorAll('.category-block');

  categoryBlocks.forEach(block => {
    const cardsContainer = block.querySelector('.category-cards-container');
    const leftBtn = block.querySelector('.left-arrow');
    const rightBtn = block.querySelector('.right-arrow');

    if (cardsContainer && leftBtn && rightBtn) {
      // Flecha Derecha: Desplaza 500px hacia la derecha
      rightBtn.addEventListener('click', () => {
        cardsContainer.scrollBy({ left: 500, behavior: 'smooth' });
      });

      // Flecha Izquierda: Desplaza 500px hacia la izquierda
      leftBtn.addEventListener('click', () => {
        cardsContainer.scrollBy({ left: -500, behavior: 'smooth' });
      });
    }
  });


  // -------------------------------------------------------
  // 5. BOTÓN DE PLAY DEL VIDEO DE PRESENTACIÓN (PÁGINA DE JUEGO)
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
// =========================================================
// LÓGICA DE INTERACCIÓN Y NAVEGACIÓN GLOBAL
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------
    // 1. LOADER SIMULADO DE 5 SEGUNDOS
    // -------------------------------------------------------
    const loaderPercent = document.getElementById('loaderPercent');
    const loaderScreen = document.getElementById('loaderScreen');
  
    if (loaderPercent && loaderScreen) {
      let progress = 0;
  
      const interval = setInterval(() => {
        progress += 2;
        loaderPercent.textContent = `${progress}%`;
  
        if (progress >= 100) {
          clearInterval(interval);
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
  
    // Cerrar menús al hacer clic en el fondo oscuro
    if (backdropOverlay) {
      backdropOverlay.addEventListener('click', () => {
        closeSideMenu();
        if (userMenu) userMenu.classList.remove('active');
      });
    }
  
  });
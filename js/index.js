// =========================================================
// LÓGICA DE LA HOME (CARRUSEL 3D Y CATEGORÍAS)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------
    // 1. CARRUSEL COVERFLOW 3D EN HERO
    // -------------------------------------------------------
    const heroLeftArrow = document.getElementById('heroLeftArrow');
    const heroRightArrow = document.getElementById('heroRightArrow');
  
    if (heroLeftArrow && heroRightArrow) {
      let positions = ['pos-left', 'pos-center', 'pos-right'];
  
      function updatePositions() {
        const cards = document.querySelectorAll('.hero-card');
        cards.forEach((card, index) => {
          card.classList.remove('pos-left', 'pos-center', 'pos-right');
          card.classList.add(positions[index]);
        });
      }
  
      heroRightArrow.addEventListener('click', () => {
        positions.unshift(positions.pop());
        updatePositions();
      });
  
      heroLeftArrow.addEventListener('click', () => {
        positions.push(positions.shift());
        updatePositions();
      });
    }
  
  
    // -------------------------------------------------------
    // 2. DESPLAZAMIENTO HORIZONTAL DE CATEGORÍAS
    // -------------------------------------------------------
    const categoryBlocks = document.querySelectorAll('.category-block');
  
    categoryBlocks.forEach(block => {
      const cardsContainer = block.querySelector('.category-cards-container');
      const leftBtn = block.querySelector('.left-arrow');
      const rightBtn = block.querySelector('.right-arrow');
  
      if (cardsContainer && leftBtn && rightBtn) {
        rightBtn.addEventListener('click', () => {
          cardsContainer.scrollBy({ left: 500, behavior: 'smooth' });
        });
  
        leftBtn.addEventListener('click', () => {
          cardsContainer.scrollBy({ left: -500, behavior: 'smooth' });
        });
      }
    });
  
  });
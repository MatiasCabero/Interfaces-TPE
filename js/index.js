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


  

  // =======================================================
  // INICIO DE EDICIÓN: INTEGRACIÓN DE API V2 Y MODAL
  // =======================================================
  const API_URL = 'https://vj.interfaces.jima.com.ar/api/v2';
  const apiContainer = document.getElementById('api-games-container');
  const modal = document.getElementById('modal-detalle');
  const modalBody = document.getElementById('modal-body');
  const closeBtn = document.getElementById('modal-close');

  // DATOS DE RESPALDO (FALLBACK) POR SI LA API O RED FALLAN
  const HARDCODED_GAMES = [
    {
      id: 3498,
      name: "Grand Theft Auto V",
      released: "2013-09-17",
      background_image_low_res: "https://media.rawg.io/media/crop/600/400/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg",
      rating: 4.47,
      description: "Rockstar Games local fallback description when offline.",
      platforms: [{ name: "PC" }, { name: "PlayStation" }, { name: "Xbox" }],
      genres: [{ name: "Action" }]
    },
    {
      id: 3328,
      name: "The Witcher 3: Wild Hunt",
      released: "2015-05-18",
      background_image_low_res: "https://media.rawg.io/media/crop/600/400/games/618/618c47b6e369d39b4f371630a82ce00d.jpg",
      rating: 4.66,
      description: "Geralt of Rivia is a monster hunter for hire.",
      platforms: [{ name: "PC" }, { name: "PlayStation" }],
      genres: [{ name: "RPG" }]
    }
  ];

  async function loadApiGames() {
    if (!apiContainer) return;

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const games = await response.json();
      renderApiGames(games);
    } catch (error) {
      console.warn("Error al cargar API, se usará versión local (Hardcoded):", error);
      renderApiGames(HARDCODED_GAMES);
    }
  }

  function renderApiGames(games) {
    apiContainer.innerHTML = '';

    games.forEach(game => {
      // USO DE IMAGEN OPTIMIZADA DE LA API V2
      const imageUrl = game.background_image_low_res || game.background_image;

      const card = document.createElement('article');
      card.classList.add('game-card');
      
      card.innerHTML = `
        <img src="${imageUrl}" alt="${game.name}" class="card-img" loading="lazy">
        <div class="card-gradient-overlay"></div>
        <span class="game-title">${game.name}</span>
      `;

      // AL HACER CLIC EN LA TARJETA SE DESPLIEGA EL MODAL DETALLADO
      card.addEventListener('click', () => openModal(game));
      apiContainer.appendChild(card);
    });
  }

  function openModal(game) {
    if (!modal || !modalBody) return;

    const imageUrl = game.background_image || game.background_image_low_res;
    const platformsText = game.platforms ? game.platforms.map(p => p.name).join(', ') : 'No disponible';
    const genresText = game.genres ? game.genres.map(g => g.name).join(', ') : 'No disponible';
    const descriptionText = game.description || 'Sin descripción disponible para este juego.';

    modalBody.innerHTML = `
      <img src="${imageUrl}" alt="${game.name}" class="modal-game-img">
      <h2 class="modal-game-title">${game.name}</h2>
      <p><strong>Fecha de lanzamiento:</strong> ${game.released || 'N/A'}</p>
      <p><strong>Calificación:</strong> ★ ${game.rating || 'N/A'} / 5</p>
      <p><strong>Géneros:</strong> ${genresText}</p>
      <p><strong>Plataformas:</strong> ${platformsText}</p>
      <p class="modal-game-description">${descriptionText}</p>
    `;

    modal.classList.remove('hidden');
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  // INICIALIZACIÓN DE CARGA DE JUEGOS DESDE LA API
  loadApiGames();
  // =======================================================
  // FIN DE EDICIÓN: INTEGRACIÓN DE API V2 Y MODAL
  // =======================================================

});
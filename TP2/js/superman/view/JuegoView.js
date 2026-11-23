/* lee el estado actual del Modelo y lol refleja en el DOM usando CSS y transformaciones 
aceleradas por hardware (translate3d), sin calcular físicas ni reglas del juego. */

class JuegoView {
  constructor(model) {
    this.model = model;

    // Referencias del DOM
    this.escenarioEl = document.getElementById('escenarioJuego');
    this.capaCieloEl = document.getElementById('capaCielo');
    this.capaCiudadEl = document.getElementById('capaCiudad');
    this.capaCalleEl = document.getElementById('capaCalle');
    this.capaAutosEl = document.getElementById('capaAutos');
    this.capaEdificiosEl = document.getElementById('capaEdificios');
    this.capaNubesEl = document.getElementById('capaNubes');
    this.capaItemsEl = document.getElementById('capaItems');

    this.supermanBoxEl = document.getElementById('supermanBox');
    this.supermanSpriteEl = document.getElementById('supermanSprite');

    this.iconosVidaEl = document.querySelectorAll('#hudVidas .icono-vida');
    this.hudPuntosEl = document.getElementById('hudPuntos');

    this.startOverlayEl = document.getElementById('startOverlay');
    this.gameOverOverlayEl = document.getElementById('gameOverOverlay');
    this.finalPuntosEl = document.getElementById('finalPuntos');

    this.ultimoEstadoId = -1;
    this.vidasMostradas = -1;
    this.puntosMostrados = -1;
    this.estadoPantallaMostrado = '';

    // PARA VER LA HITBOX DE SUPERMAN CAMBIAR A TRUE //
    this.mostrarDebugHitbox = false;
    this.debugBoxEl = null;

    this.inicializarAutosDOM();
    this.registrarEventosAnimacion();
    this.precargarImagenes();
  }

  // Precarga de spritesheets para que no parpadeen la primera vez que aparecen
  precargarImagenes() {
    const rutas = [
      'Assets/superman/volando.png',
      'Assets/superman/corazon.png',
      'Assets/superman/meteoritoverde.png',
      'Assets/superman/fondo.JPG',
      'Assets/superman/nubes.png', 
      'Assets/superman/calle.png',
      'Assets/superman/auto 1.png',
      'Assets/superman/auto 2.png',
      'Assets/superman/auto 3.png',
      'Assets/superman/edificio 1.png',
      'Assets/superman/edificio 2.png',
      'Assets/superman/edificio 3.png',
      'Assets/superman/edificio 4.png',
      'Assets/superman/edificio 5.png'
    ];
    rutas.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  // a diferencia de los edificios los autos no se crean y destruyen
  // son los mismos 3 dando vueltas en bucle. Creando sus nodos DOM una sola vez al principio 
  // y reutilizándolos en cada vuelta, evitamos crear y destruir nodos constantemente, ahorrando 
  // memoria y procesamiento
  inicializarAutosDOM() {
    for (const auto of this.model.autos) {
      const div = document.createElement('div');
      div.className = `auto-trafico auto-${auto.tipo}`;
      this.capaAutosEl.appendChild(div);
      auto.el = div;
    }
  }

  // permite que cuando termine una animacion, y si el usuario sigue con vida, 
  // superman vuelva al estado de vuelo
  registrarEventosAnimacion() {
    this.supermanSpriteEl.addEventListener('animationend', (e) => {
      if (
        e.animationName === 'cabeceo-impulso' ||
        e.animationName === 'golpe-edificio' ||
        e.animationName === 'curar-brillo'
      ) {
        if (this.model.superman.vidas > 0) {
          this.model.superman.ponerEstado('vuela');
        }
      }
    });
  }

  // cambia el estado (animacion) del superman, salvo que este estado sea el base
  //  de volar. Primero borra cualquier estado que haya y luego aplica el correspondiente
  aplicarClaseEstadoSuperman(estado) {
    this.supermanSpriteEl.classList.remove(
      'impulso',
      'chocado',
      'chocado-edificio',
      'curado',
      'muerto'
    );

    if (estado !== 'vuela') {
      this.supermanSpriteEl.classList.add(estado);
    }
  }

  renderizar() {
    this.renderizarParallax();
    this.renderizarAutos();
    this.renderizarEdificios();
    this.renderizarItems();
    this.renderizarSuperman();
    this.renderizarHUD();
    this.renderizarOverlays();
  }

  // agarramos la coordenada X de cada capa (viene del modelo) y desplazamos
  // la imagen de fondo del DIV correspondiente a cada capa con la propiedad
  // backgroundPositionX de CSS
  /* los valores estan negativos para dar el efecto de que se mueve de izquierda a derecha */
  renderizarParallax() {
    const { cielo, nubes, ciudad, calle } = this.model.capasParallax;
    this.capaCieloEl.style.backgroundPositionX = `${-cielo.x}px`;
    this.capaNubesEl.style.backgroundPositionX = `${-nubes.x}px`;
    this.capaCiudadEl.style.backgroundPositionX = `${-ciudad.x}px`;
    this.capaCalleEl.style.backgroundPositionX = `${-calle.x}px`;
  }

  // recorre los 3 autos y actualiza su posicion visual en la pantalla
  // usamos translate3d pq esto fuerza al navegador a usar la GPU 
  // (fue recomendaco por gemini para reemplzara translate(x,y))
  renderizarAutos() {
    for (const auto of this.model.autos) {
      if (auto.el) {
        auto.el.style.transform = `translate3d(${auto.x}px, ${auto.y - 575}px, 0)`;
                                                // ancho        alto           profundidad que se la sacamos pq no es 3D
      }
    }
  }

  renderizarEdificios() {
    // 1. Borrar del DOM los edificios que salieron de pantalla, son enviados desde el modelo
    while (this.model.edificiosAEliminar.length > 0) {
      const viejo = this.model.edificiosAEliminar.shift();
      if (viejo.elArriba) viejo.elArriba.remove();
      if (viejo.elAbajo) viejo.elAbajo.remove();
    }

    // 2. Crear o actualizar posición con transform
    for (const ed of this.model.edificios) {
      // Edificio inferior (siempre existe)
      const cajaAbajo = ed.cajaAbajo();
      if (!ed.elAbajo) {
        const divAbajo = document.createElement('div');
        divAbajo.className = `edificio-obstaculo edificio-tipo-${ed.tipo}`;
        divAbajo.style.width = `${ed.ancho}px`;
        divAbajo.style.height = `${cajaAbajo.h}px`;
        this.capaEdificiosEl.appendChild(divAbajo);
        ed.elAbajo = divAbajo;
      }
      ed.elAbajo.style.transform = `translate3d(${ed.x}px, ${cajaAbajo.y}px, 0)`;

      // Edificio superior espejado (solo cuando soloInferior es false)
      if (!ed.soloInferior) {
        const cajaArriba = ed.cajaArriba();
        if (!ed.elArriba) {
          const divArriba = document.createElement('div');
          divArriba.className = `edificio-obstaculo espejado edificio-tipo-${ed.tipo}`;
          divArriba.style.width = `${ed.ancho}px`;
          divArriba.style.height = `${cajaArriba.h}px`;
          this.capaEdificiosEl.appendChild(divArriba);
          ed.elArriba = divArriba;
        }
        // Invertido verticalmente (scaleY(-1)) por el villano Espejo
        ed.elArriba.style.transform = `translate3d(${ed.x}px, 0px, 0) scaleY(-1)`;
      }
    }
  }

  renderizarItems() {
    // 1. Borrar del DOM los ítems que salieron o ya fueron recolectados
    while (this.model.itemsAEliminar.length > 0) {
      const viejo = this.model.itemsAEliminar.shift();
      if (viejo.el) viejo.el.remove();
    }

    // 2. Crear o mover los activos
    for (const item of this.model.items) {
      if (!item.el) {
        const div = document.createElement('div');
        div.className = `item-entidad item-${item.tipo}`;
        this.capaItemsEl.appendChild(div);
        item.el = div;
      }

      /* cuando el personaje toma un objeto le da un efecto de que desaparece */
      if (item.tomado) {
        item.el.classList.add('tomado');
      }

      item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
    }
  }

  // traduce todo el estado físico y visual del personaje a pantalla en cada fotograma, separando 
  // movimiento, animaciones y depuración
  renderizarSuperman() {
    const sup = this.model.superman;

    // Posición y rotación físicas en el contenedor exterior
    this.supermanBoxEl.style.transform = `translate3d(${sup.x}px, ${sup.y}px, 0) rotate(${sup.angulo}deg)`;

    // Si estaba en estado 'chocado' (kriptonita) y terminó su invulnerabilidad, vuelve a volar normal
    if (sup.estado === 'chocado' && sup.invulnerable <= 0 && sup.vidas > 0) {
      sup.ponerEstado('vuela');
    }

    // Actualizar clase CSS solo cuando cambia el estado
    if (sup.estadoId !== this.ultimoEstadoId) {
      this.ultimoEstadoId = sup.estadoId;
      this.aplicarClaseEstadoSuperman(sup.estado);
    }

    // Debug opcional de hitbox
    if (this.mostrarDebugHitbox) {
      if (!this.debugBoxEl) {
        this.debugBoxEl = document.createElement('div');
        this.debugBoxEl.className = 'debug-hitbox';
        this.escenarioEl.appendChild(this.debugBoxEl);
      }
      const hb = sup.hitbox();
      this.debugBoxEl.style.width = `${hb.w}px`;
      this.debugBoxEl.style.height = `${hb.h}px`;
      this.debugBoxEl.style.transform = `translate3d(${hb.x}px, ${hb.y}px, 0)`;
    }
  }

  // muestra las vidas y puntos
  renderizarHUD() {
    const sup = this.model.superman;

    if (sup.vidas !== this.vidasMostradas) {
      this.vidasMostradas = sup.vidas;
      this.iconosVidaEl.forEach((img, indice) => {
        if (indice < sup.vidas) {
          img.classList.remove('perdida');
        } else {
          img.classList.add('perdida');
        }
      });
    }

    if (this.model.puntos !== this.puntosMostrados) {
      this.puntosMostrados = this.model.puntos;
      this.hudPuntosEl.textContent = this.model.puntos;
    }
  }

  renderizarOverlays() {
    if (this.model.estado === this.estadoPantallaMostrado) return;
    this.estadoPantallaMostrado = this.model.estado;

    if (this.model.estado === 'menu') {
      this.startOverlayEl.classList.remove('hidden');
      this.gameOverOverlayEl.classList.add('hidden');
    } else if (this.model.estado === 'jugando') {
      this.startOverlayEl.classList.add('hidden');
      this.gameOverOverlayEl.classList.add('hidden');
    } else if (this.model.estado === 'fin') {
      this.startOverlayEl.classList.add('hidden');
      this.finalPuntosEl.textContent = this.model.puntos;
      this.gameOverOverlayEl.classList.remove('hidden');
    }
  }
}
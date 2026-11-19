class SupermanController {
  constructor() {
    this.model = new JuegoModel();
    this.view = new JuegoView(this.model);

    this.entrada = {
      impulso: false
    };

    this.anterior = performance.now();
    this.escenarioEl = document.getElementById('escenarioJuego');
    this.btnJugar = document.getElementById('btnJugar');
    this.btnReiniciar = document.getElementById('btnReiniciar');

    this.registrarEventos();
    this.iniciarLoop();
  }

  registrarEventos() {
    // 1. Teclado: Espacio o Flecha Arriba (una entrada por pulsación: !e.repeat)
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
        // Evitar que la barra espaciadora haga scroll en la página mientras jugás
        if (this.model.estado === 'jugando' || document.activeElement === document.body) {
          e.preventDefault();
        }
        this.entrada.impulso = true;
      }
    });

    // 2. Clic / toque dentro del escenario del juego
    this.escenarioEl.addEventListener('pointerdown', (e) => {
      // Ignorar si hizo clic directamente sobre los botones de overlay
      if (e.target.closest('button')) return;
      this.entrada.impulso = true;
    });

    // 3. Botón verde "Jugar" en la pantalla inicial
    this.btnJugar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.entrada.impulso = false;
      this.model.iniciarPartida();
    });

    // 4. Botón "Volver a Jugar" en Game Over
    this.btnReiniciar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.entrada.impulso = false;
      this.model.iniciarPartida();
    });
  }

  iniciarLoop() {
    const frame = (ahora) => {
      // dt en segundos con tope de 0.05s para evitar saltos al cambiar de pestaña
      const dt = Math.min((ahora - this.anterior) / 1000, 0.05);
      this.anterior = ahora;

      // Consumir entrada anotada
      if (this.entrada.impulso) {
        this.model.procesarImpulso();
        this.entrada.impulso = false;
      }

      // Actualizar Modelo y Renderizar Vista
      this.model.actualizar(dt);
      this.view.renderizar();

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }
}

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.juegoSuperman = new SupermanController();
});
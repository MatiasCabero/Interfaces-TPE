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

  arrancarConParpadeo() {
    this.entrada.impulso = false;

    // Reinicia la animación CSS de parpadeo en el escenario
    this.escenarioEl.classList.remove('escenario-flash');
    void this.escenarioEl.offsetWidth; // Fuerza reflow para que siempre se dispare
    this.escenarioEl.classList.add('escenario-flash');

    this.model.iniciarPartida();
  }

  registrarEventos() {
    // 1. Teclado: Espacio o Flecha Arriba (una entrada por pulsación: !e.repeat)
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
        if (
          this.model.estado === 'menu' ||
          this.model.estado === 'jugando' ||
          document.activeElement === document.body
        ) {
          e.preventDefault();
        }

        // Si está en el menú inicial, Espacio arranca la partida igual que el botón "Jugar"
        if (this.model.estado === 'menu') {
          this.arrancarConParpadeo();
          return;
        }

        // Si ya está jugando, impulsa a Superman
        this.entrada.impulso = true;
      }
    });

    // 2. Clic / toque dentro del escenario del juego
    this.escenarioEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      this.entrada.impulso = true;
    });

    // 3. Botón verde "Jugar" en la pantalla inicial (clic con mouse)
    this.btnJugar.addEventListener('click', (e) => {
      e.stopPropagation();
      e.currentTarget.blur();
      this.arrancarConParpadeo();
    });

    // 4. Botón "Volver a Jugar" en Game Over (sin parpadeo)
    this.btnReiniciar.addEventListener('click', (e) => {
      e.stopPropagation();
      e.currentTarget.blur();
      this.entrada.impulso = false;
      this.model.iniciarPartida();
    });
  }

  iniciarLoop() {
    const frame = (ahora) => {
      const dt = Math.min((ahora - this.anterior) / 1000, 0.05);
      this.anterior = ahora;

      if (this.entrada.impulso) {
        this.model.procesarImpulso();
        this.entrada.impulso = false;
      }

      this.model.actualizar(dt);
      this.view.renderizar();

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.juegoSuperman = new SupermanController();
});
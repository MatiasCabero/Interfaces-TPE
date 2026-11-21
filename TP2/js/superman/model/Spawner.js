class Spawner {
  constructor(anchoEscenario = 1470, altoJugable = 585) {
    this.anchoEscenario = anchoEscenario;
    this.altoJugable = altoJugable;
    this.reiniciar();
  }

  reiniciar() {
    this.distanciaParaProximo = 120;
    this.ultimoCentro = this.altoJugable / 2;
    this.edificiosGenerados = 0;
    this.edificiosDesdeUltimoCorazon = 0;
    this.edificiosDesdeUltimaKriptonita = 0;
  }

  azar(min, max) {
    return Math.random() * (max - min) + min;
  }

  azarEntero(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  actualizar(dt, velocidad, tiempoJugado, estadoJuego, vidasActuales, puntosActuales = 0) {
    const nuevosEdificios = [];
    const nuevosItems = [];

    this.distanciaParaProximo -= velocidad * dt;

    if (this.distanciaParaProximo <= 0) {
      const soloInferior = (estadoJuego === 'menu');

      const huecoBase = Math.max(165, 250 - tiempoJugado * 1.3);
      const hueco = huecoBase + this.azar(-10, 10);

      const margenTecho = 75 + hueco / 2;
      const margenPiso = this.altoJugable - 75 - hueco / 2;

      const minCentro = Math.max(margenTecho, this.ultimoCentro - 140);
      const maxCentro = Math.min(margenPiso, this.ultimoCentro + 140);
      const centro = this.azar(minCentro, maxCentro);
      this.ultimoCentro = centro;

      const distMin = Math.max(240, 290 - tiempoJugado * 0.8);
      const distMax = Math.max(300, 370 - tiempoJugado * 0.8);
      const distanciaSiguiente = this.azar(distMin, distMax);
      this.distanciaParaProximo = distanciaSiguiente;

      const edificio = new ParEdificios({
        x: this.anchoEscenario + 20,
        centro,
        hueco,
        tipo: this.azarEntero(1, 5),
        soloInferior,
        altoEscenario: this.altoJugable
      });
      nuevosEdificios.push(edificio);
      this.edificiosGenerados++;
      this.edificiosDesdeUltimoCorazon++;
      this.edificiosDesdeUltimaKriptonita++;

      // Spawnear ítems solo en 'jugando'
      if (!soloInferior) {
        const xItem = this.anchoEscenario + 20 + distanciaSiguiente * 0.5;
        const juegoRapido = tiempoJugado > 22;

        // 1. Corazones: solo si perdió al menos 1 vida, con mínimo 6 edificios de separación,
        //    muy raros al principio (12%) y más probables cuando el juego ya va rápido (28%)
        const puedeSalirCorazon =
          vidasActuales < 3 && this.edificiosDesdeUltimoCorazon >= 6;
        const probCorazon = puedeSalirCorazon ? (juegoRapido ? 0.28 : 0.12) : 0;

        // 2. Kriptonitas: arrancan a los 30 puntos y escalan progresivamente con el puntaje
        const puntosExtra = Math.max(0, puntosActuales - 30);

        // Descanso entre kriptonitas: baja gradualmente de cada 4 edificios hasta cada 2 edificios
        const descansoKriptonita = Math.max(2, 4 - Math.floor(puntosExtra / 20));

        // Probabilidad: arranca en 22% a los 30 pts y sube progresivamente hasta un tope de 50%
        const probKriptonita =
          puntosActuales >= 30 && this.edificiosDesdeUltimaKriptonita >= descansoKriptonita
            ? Math.min(0.50, 0.22 + puntosExtra * 0.006)
            : 0;

        const roll = Math.random();

        if (roll < probCorazon) {
          const arriba = Math.random() < 0.5;
          const desplazamiento = this.azar(110, 145) * (arriba ? -1 : 1);
          const yCorazon = Math.max(45, Math.min(this.altoJugable - 110, centro + desplazamiento));

          nuevosItems.push(new ItemAnimado({ x: xItem, y: yCorazon, tipo: 'corazon' }));
          this.edificiosDesdeUltimoCorazon = 0;
        } else if (roll < probCorazon + probKriptonita) {
          // Altura completamente aleatoria en toda la pantalla jugable
          const yKriptonita = this.azar(35, this.altoJugable - 100);

          // Velocidad extra: suave cuando recién aparecen (~75-130 px/s) y luego aleatoria con picos rápidos (hasta ~310 px/s)
          const velExtraMin = 75;
          const velExtraMax = Math.min(310, 130 + puntosExtra * 4.5);
          const velocidadExtra = this.azar(velExtraMin, velExtraMax);

          nuevosItems.push(
            new ItemAnimado({
              x: xItem,
              y: yKriptonita,
              tipo: 'kriptonita',
              velocidadExtra
            })
          );
          this.edificiosDesdeUltimaKriptonita = 0;
        }
      }
    }

    return { nuevosEdificios, nuevosItems };
  }
}
class JuegoModel {
  constructor() {
    this.ANCHO = 1470;
    this.ALTO = 650;
    this.ALTO_CALLE = 65;
    this.ALTO_JUGABLE = this.ALTO - this.ALTO_CALLE; // 585px

    this.VELOCIDAD_INICIAL = 215; // px/s
    this.VELOCIDAD_MAXIMA = 370;  // px/s

    this.superman = new Superman(240, 250);
    this.spawner = new Spawner(this.ANCHO, this.ALTO_JUGABLE);

    // 4 Capas de Parallax (factores de profundidad: lejos lento, cerca rápido)
    this.capasParallax = {
      cielo:  { x: 0, factor: 0.04, anchoTile: 1470 },
      ciudad: { x: 0, factor: 0.14, anchoTile: 1365 },
      calle:  { x: 0, factor: 1.00, anchoTile: 1365 } // Factor 1 = misma velocidad que edificios
    };

    // Capa 4: Autos circulando por la calle
    this.autos = [
      { id: 1, tipo: 1, x: 350,  y: 590, ancho: 110, velRelativa: 95,  el: null },
      { id: 2, tipo: 2, x: 880,  y: 602, ancho: 90,  velRelativa: 145, el: null },
      { id: 3, tipo: 3, x: 1320, y: 586, ancho: 58,  velRelativa: 120, el: null }
    ];

    this.edificios = [];
    this.items = [];
    this.edificiosAEliminar = [];
    this.itemsAEliminar = [];

    this.estado = 'menu'; // 'menu' | 'jugando' | 'fin'
    this.puntos = 0;
    this.tiempoJugado = 0;
    this.velocidad = this.VELOCIDAD_INICIAL;

    // Precargamos un par de edificios inferiores iniciales para el fondo del menú
    this.poblarEscenarioInicial();
  }

  poblarEscenarioInicial() {
    this.edificios = [
      new ParEdificios({ x: 680,  centro: 370, hueco: 220, tipo: 1, soloInferior: true, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 1120, centro: 340, hueco: 220, tipo: 3, soloInferior: true, altoEscenario: this.ALTO_JUGABLE })
    ];
  }

  iniciarPartida() {
    // Si venimos de Game Over ('fin'), sí limpiamos los edificios congelados
    if (this.estado === 'fin') {
      this.edificiosAEliminar.push(...this.edificios);
      this.edificios = [];
      this.spawner.reiniciar();
      this.superman.reiniciar();
    } else {
      // Si venimos del 'menu', transición continua: los edificios siguen pasando
      const yActual = this.superman.y;
      const anguloActual = this.superman.angulo;
      this.superman.reiniciar();
      this.superman.y = yActual;
      this.superman.angulo = anguloActual;

      this.spawner.edificiosGenerados = 0;
      this.spawner.edificiosDesdeUltimoCorazon = 0;
      this.spawner.edificiosDesdeUltimaKriptonita = 0;
    }

    this.itemsAEliminar.push(...this.items);
    this.items = [];

    this.puntos = 0;
    this.tiempoJugado = 0;
    this.velocidad = this.VELOCIDAD_INICIAL;
    this.estado = 'jugando';

    this.superman.impulsar();
  }

  procesarImpulso() {
    if (this.estado === 'jugando') {
      this.superman.impulsar();
    }
  }

  // Detección de colisión entre dos rectángulos (AABB)
  choca(a, b) {
    if (!a || !b) return false;
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  actualizar(dt) {
    // 1. Actualizar velocidad del mundo (acelera gradualmente en 'jugando')
    if (this.estado === 'jugando') {
      this.tiempoJugado += dt;
      this.velocidad = Math.min(
        this.VELOCIDAD_MAXIMA,
        this.VELOCIDAD_INICIAL + this.tiempoJugado * 4.2
      );
    } else if (this.estado === 'menu') {
      this.velocidad = 150;
    } else {
      // En 'fin' (Game Over) el escenario frena
      this.velocidad = 0;
    }

    // 2. Actualizar las 3 capas de fondo parallax con dt
    for (const key in this.capasParallax) {
      const capa = this.capasParallax[key];
      capa.x = (capa.x + this.velocidad * capa.factor * dt) % capa.anchoTile;
    }

    // 3. Actualizar Capa 4: Autos sobre la calle
    for (const auto of this.autos) {
      if (this.estado !== 'fin') {
        auto.x -= (this.velocidad + auto.velRelativa) * dt;
        if (auto.x + auto.ancho < -40) {
          auto.x = this.ANCHO + 60 + Math.random() * 250;
        }
      }
    }

    // 4. Actualizar Superman según el estado
    const vidasAntes = this.superman.vidas;

    if (this.estado === 'menu') {
      this.superman.actualizarEnMenu(dt);
    } else if (this.estado === 'jugando') {
      this.superman.actualizar(dt);

      // Si perdió vida al tocar el piso/calle y sigue vivo, resetea la velocidad del mundo
      if (this.superman.vidas < vidasAntes && this.superman.vidas > 0) {
        this.tiempoJugado = 0;
        this.velocidad = this.VELOCIDAD_INICIAL;
      }
    }

    if (this.estado === 'fin') return;

    // 5. Spawner: generar nuevos edificios e ítems
    const { nuevosEdificios, nuevosItems } = this.spawner.actualizar(
      dt,
      this.velocidad,
      this.tiempoJugado,
      this.estado,
      this.superman.vidas,
      this.puntos
    );
    this.edificios.push(...nuevosEdificios);
    this.items.push(...nuevosItems);

    // 6. Mover edificios, evaluar puntaje y colisiones
    const hitboxSuperman = this.superman.hitbox();

    for (const ed of this.edificios) {
      ed.actualizar(dt, this.velocidad);

      if (this.estado === 'jugando') {
        // Sumar +1 punto cuando Superman atraviesa el edificio
        if (!ed.superado && ed.x + ed.ancho < this.superman.x) {
          ed.superado = true;
          this.puntos += 1;
        }

        // Verificar choque contra edificio superior (espejado) o inferior
        if (this.choca(hitboxSuperman, ed.cajaArriba()) || this.choca(hitboxSuperman, ed.cajaAbajo())) {
          const recibioDanio = this.superman.recibirDanio('edificio');
          if (recibioDanio && this.superman.vidas > 0) {
            this.tiempoJugado = 0;
            this.velocidad = this.VELOCIDAD_INICIAL;
          }
        }
      }
    }

    // 7. Mover ítems animados (corazones y kriptonita) y evaluar colisiones
    if (this.estado === 'jugando') {
      for (const item of this.items) {
        item.actualizar(dt, this.velocidad);

        if (!item.tomado && this.choca(hitboxSuperman, item.caja())) {
          item.tomado = true;

          if (item.tipo === 'corazon') {
            const recuperoVida = this.superman.curar();
            if (!recuperoVida) {
              // Si ya tenía 3 vidas, suma +3 puntos extra
              this.puntos += 3;
            }
          } else if (item.tipo === 'kriptonita') {
            this.superman.recibirDanio('kriptonita');
          }
        }
      }
    }

    // 8. Verificar fin de juego si Superman se quedó sin vidas
    if (this.estado === 'jugando' && this.superman.vidas <= 0) {
      this.estado = 'fin';
    }

    // 9. Eliminar del arreglo los objetos que salieron de pantalla (y encolarlos para borrar del DOM)
    while (this.edificios.length > 0 && this.edificios[0].estaFueraDePantalla()) {
      this.edificiosAEliminar.push(this.edificios.shift());
    }

    this.items = this.items.filter((item) => {
      if (item.estaFueraDePantalla()) {
        this.itemsAEliminar.push(item);
        return false;
      }
      return true;
    });
  }
}
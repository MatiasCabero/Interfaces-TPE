// es el director general del Modelo (el único archivo del Modelo que conoce y coordina a 
// todas las demás entidades: Superman, Spawner, ParEdificios, ItemAnimado, el parallax y los autos)

//JuegoModel interactúa directamente con las tres clases: le pide a Spawner que genere nuevas instancias 
//de ParEdificios e ItemAnimado, y luego asume la propiedad de esas instancias para actualizarlas frame a frame, 
//evaluar sus colisiones con Superman y descartarlas cuando salen de pantalla.

class JuegoModel {
  constructor() {
    this.ANCHO = 1470;
    this.ALTO = 650;
    this.ALTO_CALLE = 65;
    this.ALTO_JUGABLE = this.ALTO - this.ALTO_CALLE; // 585px

    // velocidad a la que se mueve el mundo al iniciar
    this.VELOCIDAD_INICIAL = 600; // px/s
    this.VELOCIDAD_MAXIMA = 1200;  // px/s

    this.superman = new Superman(240, 250);
    this.spawner = new Spawner(this.ANCHO, this.ALTO_JUGABLE);

    // 5 Capas de Parallax (factores de profundidad: lejos lento, cerca rápido)
    /* 
    FACTOR es el multiplicador por la velocidad del juego (this.velocidad) 
    ANCHOTILE es el ancho de la imagen
    X es cuanto pixeles se corrio esa cinta desde que empezo el juego
    */
    this.capasParallax = {
      cielo:       { x: 0, factor: 0.14, anchoTile: 1470 },
      ciudad:      { x: 0, factor: 0.24, anchoTile: 1379 },
      nubes:       { x: 0, factor: 0.34, anchoTile: 5664 },
      calle:       { x: 0, factor: 1.00, anchoTile: 1249 }
    };

    // Capa 5: Autos circulando por la calle
    /* 
    X la posicion inicial en pantalla
    Y la posicion en la calle
    ANCHO es el ancho de cada auto
    VELRELATIVA es su velocidad propia
    EL el espacio reservado en el DOM
    */
    this.autos = [
      { id: 1, tipo: 1, x: 350,  y: 568, ancho: 162, velRelativa: 95,  el: null },
      { id: 2, tipo: 2, x: 880,  y: 584, ancho: 134, velRelativa: 145, el: null },
      { id: 3, tipo: 3, x: 1320, y: 564, ancho: 86,  velRelativa: 120, el: null }
    ];

    this.edificios = [];
    this.items = [];
    this.edificiosAEliminar = [];
    this.itemsAEliminar = [];

    this.estado = 'menu'; // 'menu' | 'jugando' | 'fin'
    this.puntos = 0;
    this.puntajeAnterior = 0;
    this.tiempoJugado = 0;
    this.velocidad = this.VELOCIDAD_INICIAL;
    this.tiempoFrenoChoque = 0; // Temporizador de desaceleración breve al chocar
    this.tiempoMuerte = 0;
    this.tiempoTransicion = 0;  // Temporizador del parpadeo al iniciar partida
    this.switchRealizado = false;

    // Precargamos un par de edificios inferiores iniciales para el fondo del menú
    this.poblarEscenarioInicial();
  }

  poblarEscenarioInicial() {
    this.edificios = [
      new ParEdificios({ x: 300,  centro: 390, hueco: 220, tipo: 1, soloInferior: true, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 480,  centro: 350, hueco: 220, tipo: 3, soloInferior: true, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 660,  centro: 400, hueco: 220, tipo: 2, soloInferior: true, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 840,  centro: 360, hueco: 220, tipo: 4, soloInferior: true, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 1020, centro: 385, hueco: 220, tipo: 5, soloInferior: true, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 1200, centro: 345, hueco: 220, tipo: 1, soloInferior: true, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 1380, centro: 395, hueco: 220, tipo: 3, soloInferior: true, altoEscenario: this.ALTO_JUGABLE })
    ];
  }

  // Crea de golpe toda la tanda inicial de edificios espejados en toda la pantalla
  poblarEdificiosEspejadosIniciales() {
    this.edificiosAEliminar.push(...this.edificios);
    this.itemsAEliminar.push(...this.items);
    this.items = [];

    const edDetras = new ParEdificios({ x: 100, centro: 310, hueco: 215, tipo: 5, soloInferior: false, altoEscenario: this.ALTO_JUGABLE });
    edDetras.superado = true; // Ya está atrás de Superman al iniciar, no suma punto 

    // estos son los unicos edificios que creamos a mano, el resto son creados todos al azar por el spawner
    this.edificios = [
      edDetras,
      new ParEdificios({ x: 430,  centro: 265, hueco: 215, tipo: 2, soloInferior: false, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 740,  centro: 335, hueco: 215, tipo: 4, soloInferior: false, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 1050, centro: 250, hueco: 215, tipo: 1, soloInferior: false, altoEscenario: this.ALTO_JUGABLE }),
      new ParEdificios({ x: 1360, centro: 315, hueco: 215, tipo: 3, soloInferior: false, altoEscenario: this.ALTO_JUGABLE })
    ];

    this.spawner.reiniciar();
    // El próximo edificio del spawner entrará manteniendo la misma separación (~310px después del último en x=1360)
    this.spawner.distanciaParaProximo = 180;
  }

  iniciarPartida() {
    const veniaDeMenu = this.estado === 'menu';

    // Si venimos de Game Over ('fin'), limpiamos de inmediato sin parpadeo; si venimos del menú, el switch ocurre a mitad del parpadeo
    if (!veniaDeMenu) {
      this.poblarEdificiosEspejadosIniciales();
      this.switchRealizado = true;
      this.tiempoTransicion = 0;
    } else {
      this.switchRealizado = false;
      this.tiempoTransicion = 0.6; // Duración de los 3 parpadeos suaves antes de arrancar
    }

    this.superman.reiniciar();

    this.puntos = 0;
    this.tiempoJugado = 0;
    this.tiempoFrenoChoque = 0;
    this.tiempoMuerte = 0;
    this.velocidad = this.VELOCIDAD_INICIAL;
    this.estado = 'jugando';

    if (!veniaDeMenu) {
      this.superman.impulsar();
    }
  }

  procesarImpulso() {
    if (this.estado === 'jugando' && this.tiempoTransicion <= 0) {
      this.superman.impulsar();
    }
  }

  // Detección de colisión entre dos rectángulos (AABB)
  // son las condiciones para que se considere que las hitbox chocaron
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
    // 0. Durante el parpadeo inicial, pausamos un instante y hacemos el switch cuando el velo tapa al 100%
    if (this.estado === 'jugando' && this.tiempoTransicion > 0) {
      this.tiempoTransicion -= dt;

      if (!this.switchRealizado && this.tiempoTransicion <= 0.31) {
        this.poblarEdificiosEspejadosIniciales();
        this.switchRealizado = true;
      }

      if (this.tiempoTransicion <= 0) {
        this.tiempoTransicion = 0;
        this.superman.impulsar();
      }
      return;
    }

    const estaMuriendo = this.estado === 'jugando' && this.superman.vidas <= 0;

    // 1. Actualizar velocidad del mundo
    /* la velocidad si el estado es fin */
    if (estaMuriendo || this.estado === 'fin') {
      // Apenas pierde la última vida, el mundo frena para lucir la animación de muerte
      this.velocidad = 0;
      /* la velocidad si el estado es jugando */
    } else if (this.estado === 'jugando') {
      this.tiempoJugado += dt;

      const velocidadObjetivo = Math.min(
        this.VELOCIDAD_MAXIMA,
        this.VELOCIDAD_INICIAL + this.tiempoJugado * 8.2  /* esta es la ACELERACION que tiene el juego 
                                                             por cada segundo que pasa */
      );

      if (this.tiempoFrenoChoque > 0) {
        this.tiempoFrenoChoque = Math.max(0, this.tiempoFrenoChoque - dt);
        const velocidadFrenada = velocidadObjetivo * 0.55;
        this.velocidad += (velocidadFrenada - this.velocidad) * Math.min(1, dt * 10);
      } else {
        this.velocidad += (velocidadObjetivo - this.velocidad) * Math.min(1, dt * 6);
      }
      /* la velocidad si el estado es menu */
    } else if (this.estado === 'menu') {
      this.velocidad = 150;
    }

    // 2. Actualiza frame a frame las 4 capas de fondo parallax con dt
    for (const key in this.capasParallax) {
      const capa = this.capasParallax[key];
      capa.x = (capa.x + this.velocidad * capa.factor * dt) % capa.anchoTile;
    }

    // 3. Actualizar Capa 5: Autos sobre la calle
    for (const auto of this.autos) {
      if (this.estado !== 'fin' && !estaMuriendo) {
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

      // Si perdió vida al tocar el piso/calle y sigue vivo, aplica freno breve de 1.8s
      if (this.superman.vidas < vidasAntes && this.superman.vidas > 0) {
        this.tiempoFrenoChoque = 1.8;
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
            this.tiempoFrenoChoque = 1.8;
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
            const recibioDanio = this.superman.recibirDanio('kriptonita');
            if (recibioDanio && this.superman.vidas > 0) {
              this.tiempoFrenoChoque = 1.8;
            }
          }
        }
      }
    }

    // 8. Si Superman se quedó sin vidas, esperar 1.8s para ver su animación de muerte antes del cartel
    if (this.estado === 'jugando' && this.superman.vidas <= 0) {
      if (this.tiempoMuerte <= 0) {
        this.tiempoMuerte = 1.8; // Inicia la cuenta regresiva la primera vez que llega a 0 vidas
      } else {
        this.tiempoMuerte -= dt;
        if (this.tiempoMuerte <= 0) {
          this.tiempoMuerte = 0;
          this.estado = 'fin'
          this.puntajeAnterior=this.puntos;
        }
      }
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
// modela las entidades recolectables del juego ('corazon' y 'kriptonita'), encargándose de 
// su desplazamiento, movimiento ondulatorio, caja de colisión (hitbox) y ciclo de vida 
// en el Modelo.

class ItemAnimado {
  constructor({ x, y, tipo, velocidadExtra = null }) {
    this.id = ItemAnimado.siguienteId++;
    this.x = x;
    this.y = y;
    this.yBase = y; /* guarda la altura original donde aparecio el item */
    this.tiempo = Math.random() * Math.PI * 2; /* nos da la aleatorieidad */
    this.tipo = tipo; // 'corazon' | 'kriptonita'

    // las medidas del corazon y la criptonita
    this.ancho = tipo === 'corazon' ? 72 : 92; 
    this.alto = tipo === 'corazon' ? 64 : 69;

    // Si el Spawner le pasa una velocidadExtra personalizada la usa; si no (null), aplica 
    // el valor por defecto según el tipo: 75 px/s extra para la kriptonita y 0 para el corazón.
    this.velocidadExtra =
      velocidadExtra !== null ? velocidadExtra : (tipo === 'kriptonita' ? 75 : 0);

    this.tomado = false;
    this.tiempoDesaparicion = 0;
    this.el = null;
  }

  actualizar(dt, velocidadMundo) {
    // sirve para mover el item de derecha a izquierda independientemente de los FPS
    this.x -= (velocidadMundo + this.velocidadExtra) * dt;
    this.tiempo += dt;

    // esta funcion sirve para que el corazon suba y baje en su propio lugar 10px
    if (this.tipo === 'corazon') {
      this.y = this.yBase + Math.sin(this.tiempo * 4) * 10;
    }

    // es el tiempo post colision, sirve para darle tiempo a la vista de 
    // reproducir la animacion css. Si saco esta linea el item se hace invisible en pantalla
    // y recien se lo elimina del arreglo cuando sale de pantalla, si dejo esta linea se elimina
    // del arreglo 0.25 segundos despues de la colision (osea cunado termina la animacion)
    if (this.tomado) {
      this.tiempoDesaparicion += dt; // dt tiempo que transcurre del fotograma actual al anterior
    }
  }

  // hitbox
  caja() {
    if (this.tipo === 'kriptonita') {
      // Hitbox centrada en la roca (ignora la estela verde de atrás)
      return {
        x: this.x + 14,
        y: this.y + 17,
        w: 52,
        h: 35
      };
    }

    return {
      x: this.x + 14,
      y: this.y + 12,
      w: this.ancho - 28,
      h: this.alto - 24
    };
  }

  // devuelve true avisandole al JuegoModel que mande el item a itemsAEliminar
  estaFueraDePantalla() {
    return this.x + this.ancho < -30 || (this.tomado && this.tiempoDesaparicion > 0.25);
  }
}

ItemAnimado.siguienteId = 1;
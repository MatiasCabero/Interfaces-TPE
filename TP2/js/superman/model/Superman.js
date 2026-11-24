// modela al personaje dentro del Modelo: su física de vuelo vertical, 
// el sistema de vidas e invulnerabilidad, la máquina de estados visuales y su hitbox.

class Superman {

  // el X de superman nunca cambia, esta fijo, solo cambia en la altura Y
  constructor(x = 240, y = 260) {
    this.xInicial = x;
    this.yInicial = y;

    // Tamaño visual del sprite (84x63)
    this.ancho = 84;
    this.alto = 63;

    // aca manejamos la fisica del personaje: GRAVEDAD E IMPULSO
    this.GRAVEDAD = 1150; // px/s²
    this.IMPULSO = 390;   // px/s

    this.TECHO = 10;
    this.PISO = 585;

    this.reiniciar();
  }

  reiniciar() {
    this.x = this.xInicial;
    this.y = this.yInicial;
    this.vy = 0; /* velocidad en Y, dice que tan rapido sube y baja superman */
    this.angulo = 0;

    this.vidas = 3;
    this.vidasMax = 3;
    this.invulnerable = 0;
    this.tiempoMenu = 0;

    /* estas dos variables controlan que animacion debe mostrar la vista (vuela, impulso,
    chocado, chocado-edificio, curado, muerto).
    estadoId se incrementa en cada cambio (ponerEstado) para que JuegoView detecte incluso 
    dos impulsos seguidos como un evento nuevo y reinicie la animación CSS */
    this.estado = 'vuela';
    this.estadoId = 0;
  }

  // cambiamos el estado
  ponerEstado(nuevoEstado) {
    this.estado = nuevoEstado;
    this.estadoId++;
  }

  impulsar() {
    if (this.vidas <= 0) return;
    this.vy = -this.IMPULSO;

    // Solo dispara la animación visual de impulso si no hay una reacción prioritaria activa
    if (this.estado === 'vuela') {
      this.ponerEstado('impulso');
    }
  }

  // esto es solo para cuando esta la pantalla del menu,
  // hace que Superman flote suavemente arriba y abajo
  actualizarEnMenu(dt) {
    this.tiempoMenu += dt;
    this.y = this.yInicial + Math.sin(this.tiempoMenu * 2.8) * 14;
    this.angulo = Math.cos(this.tiempoMenu * 2.8) * 3;
  }

  // esta es la fisica princal del personaje
  actualizar(dt) {
    if (this.invulnerable > 0) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
    }

    this.vy += this.GRAVEDAD * dt;
    this.y += this.vy * dt;

    if (this.y < this.TECHO) {
      this.y = this.TECHO;
      if (this.vy < 0) this.vy = 0;
    }

    if (this.y + this.alto > this.PISO) {
      this.y = this.PISO - this.alto;
      if (this.vidas > 0) {
        this.vy = -this.IMPULSO * 0.75;
        this.recibirDanio('edificio');
      } else {
        this.vy = 0;
      }
    }

    // Inclinación suave según velocidad vertical (entre -16° y +42°)
    const objetivoAngulo = Math.max(-16, Math.min(42, this.vy / 15));
    this.angulo += (objetivoAngulo - this.angulo) * Math.min(1, dt * 10);
  }

  recibirDanio(origen = 'edificio') {
    if (this.invulnerable > 0 || this.vidas <= 0) return false;

    this.vidas--;
    this.invulnerable = 1.85;

    if (this.vidas <= 0) {
      this.vidas = 0;
      this.ponerEstado('muerto');
    } else if (origen === 'kriptonita') {
      this.ponerEstado('chocado');
    } else {
      this.ponerEstado('chocado-edificio');
    }

    return true;
  }

  curar() {
    if (this.vidas <= 0) return false;
    this.ponerEstado('curado');

    if (this.vidas < this.vidasMax) {
      this.vidas++;
      return true;
    }
    return false;
  }

  hitbox() {
    return {
      x: this.x + 28,
      y: this.y + 22,
      w: 32,
      h: 20
    };
  }
}
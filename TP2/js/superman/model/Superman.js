class Superman {
    constructor(x = 240, y = 260) {
      this.xInicial = x;
      this.yInicial = y;
  
      // Tamaño visual del sprite (120x90)
      this.ancho = 120;
      this.alto = 90;
  
      // Constantes físicas (ajustables a gusto)
      this.GRAVEDAD = 1550; // px/s²
      this.IMPULSO = 520;   // px/s
  
      // Límites verticales del escenario (650px total - 65px de calle)
      this.TECHO = 10;
      this.PISO = 585;
  
      this.reiniciar();
    }
  
    reiniciar() {
      this.x = this.xInicial;
      this.y = this.yInicial;
      this.vy = 0;
      this.angulo = 0;
  
      this.vidas = 3;
      this.vidasMax = 3;
      this.invulnerable = 0; // Tiempo restante de invulnerabilidad en segundos
      this.tiempoMenu = 0;   // Para el vuelo ondulado antes de iniciar
  
      this.estado = 'vuela';
      this.estadoId = 0;     // Se incrementa cada vez que se dispara una reacción
    }
  
    ponerEstado(nuevoEstado) {
      this.estado = nuevoEstado;
      this.estadoId++;
    }
  
    impulsar() {
      if (this.vidas <= 0) return;
      this.vy = -this.IMPULSO;
      this.ponerEstado('impulso');
    }
  
    // Vuelo suave automático mientras está en la pantalla inicial ("Jugar")
    actualizarEnMenu(dt) {
      this.tiempoMenu += dt;
      this.y = this.yInicial + Math.sin(this.tiempoMenu * 3.2) * 18;
      this.angulo = Math.cos(this.tiempoMenu * 3.2) * 4;
    }
  
    // Física real durante la partida
    actualizar(dt) {
      if (this.invulnerable > 0) {
        this.invulnerable = Math.max(0, this.invulnerable - dt);
      }
  
      // Gravedad e integración con dt
      this.vy += this.GRAVEDAD * dt;
      this.y += this.vy * dt;
  
      // Tope superior para que no se escape por arriba de la pantalla
      if (this.y < this.TECHO) {
        this.y = this.TECHO;
        if (this.vy < 0) this.vy = 0;
      }
  
      // Tope inferior (calle): rebota suavemente si sigue vivo, o queda en el piso si murió
      if (this.y + this.alto > this.PISO) {
        this.y = this.PISO - this.alto;
        if (this.vidas > 0) {
          this.vy = -this.IMPULSO * 0.65;
          this.recibirDanio('edificio');
        } else {
          this.vy = 0;
        }
      }
  
      // Inclinación suave según velocidad vertical (entre -22° y +55°)
      const objetivoAngulo = Math.max(-22, Math.min(55, this.vy / 13));
      this.angulo += (objetivoAngulo - this.angulo) * Math.min(1, dt * 12);
    }
  
    // Recibe daño por 'edificio' o 'kriptonita' y atraviesa el obstáculo gracias a la invulnerabilidad
    recibirDanio(origen = 'edificio') {
      if (this.invulnerable > 0 || this.vidas <= 0) return false;
  
      this.vidas--;
      this.invulnerable = 1.25; // Segundos para atravesar sin volver a chocar el mismo objeto
  
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
        return true; // Recuperó una vida
      }
      return false; // Ya estaba lleno (el juego le dará puntos extra)
    }
  
    // Hitbox reducida (más chica que el dibujo 120x90 para que rozar la capa no sea injusto)
    hitbox() {
      return {
        x: this.x + 24,
        y: this.y + 24,
        w: this.ancho - 44, // 76px
        h: this.alto - 44   // 46px
      };
    }
  }
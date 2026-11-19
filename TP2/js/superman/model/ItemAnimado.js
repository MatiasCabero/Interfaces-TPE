class ItemAnimado {
    constructor({ x, y, tipo }) {
      this.id = ItemAnimado.siguienteId++;
      this.x = x;
      this.y = y;
      this.tipo = tipo; // 'corazon' | 'kriptonita'
  
      this.ancho = tipo === 'corazon' ? 100 : 120;
      this.alto = 90;
  
      // La kriptonita avanza un poquito más rápido que la ciudad
      this.velocidadExtra = tipo === 'kriptonita' ? 95 : 0;
  
      this.tomado = false;
      this.tiempoDesaparicion = 0;
      this.el = null;
    }
  
    actualizar(dt, velocidadMundo) {
      this.x -= (velocidadMundo + this.velocidadExtra) * dt;
  
      if (this.tomado) {
        this.tiempoDesaparicion += dt;
      }
    }
  
    // Hitbox centrada y justa para cada ítem
    caja() {
      return {
        x: this.x + 22,
        y: this.y + 20,
        w: this.ancho - 44,
        h: this.alto - 40
      };
    }
  
    estaFueraDePantalla() {
      return this.x + this.ancho < -30 || (this.tomado && this.tiempoDesaparicion > 0.25);
    }
  }
  
  ItemAnimado.siguienteId = 1;
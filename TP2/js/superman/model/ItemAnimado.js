class ItemAnimado {
  constructor({ x, y, tipo, velocidadExtra = null }) {
    this.id = ItemAnimado.siguienteId++;
    this.x = x;
    this.y = y;
    this.yBase = y;
    this.tiempo = Math.random() * Math.PI * 2;
    this.tipo = tipo; // 'corazon' | 'kriptonita'

    this.ancho = tipo === 'corazon' ? 72 : 92;
    this.alto = tipo === 'corazon' ? 64 : 69;

    // Si se pasa velocidadExtra la usa; si no, mantiene el valor por defecto
    this.velocidadExtra =
      velocidadExtra !== null ? velocidadExtra : (tipo === 'kriptonita' ? 75 : 0);

    this.tomado = false;
    this.tiempoDesaparicion = 0;
    this.el = null;
  }

  actualizar(dt, velocidadMundo) {
    this.x -= (velocidadMundo + this.velocidadExtra) * dt;
    this.tiempo += dt;

    if (this.tipo === 'corazon') {
      this.y = this.yBase + Math.sin(this.tiempo * 4) * 10;
    }

    if (this.tomado) {
      this.tiempoDesaparicion += dt;
    }
  }

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

  estaFueraDePantalla() {
    return this.x + this.ancho < -30 || (this.tomado && this.tiempoDesaparicion > 0.25);
  }
}

ItemAnimado.siguienteId = 1;
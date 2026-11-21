class ParEdificios {
    constructor({ x, centro, hueco, tipo = 1, soloInferior = false, altoEscenario = 585 }) {
      this.id = ParEdificios.siguienteId++;
      this.x = x;
      this.ancho = 96;
      this.centro = centro;
      this.hueco = hueco;
      this.tipo = tipo; // 1 a 5 (edificio 1.png ... edificio 5.png)
      this.soloInferior = soloInferior;
      this.altoEscenario = altoEscenario; // 650px total - 65px de calle
  
      this.superado = false; // Para sumar +1 punto una sola vez al pasarlo
      this.elArriba = null;
      this.elAbajo = null;
    }
  
    actualizar(dt, velocidad) {
      this.x -= velocidad * dt;
    }
  
    // Caja del edificio superior (invertido / espejado por el villano Espejo)
    cajaArriba() {
      if (this.soloInferior) return null;
      const altoArriba = Math.max(0, this.centro - this.hueco / 2);
      return {
        x: this.x + 6,
        y: 0,
        w: this.ancho - 12,
        h: altoArriba
      };
    }
  
    // Caja del edificio inferior (apoyado sobre la vereda/calle)
    cajaAbajo() {
      const yAbajo = this.centro + this.hueco / 2;
      const altoAbajo = Math.max(0, this.altoEscenario - yAbajo);
      return {
        x: this.x + 6,
        y: yAbajo,
        w: this.ancho - 12,
        h: altoAbajo
      };
    }
  
    // Devuelve true cuando sale completamente por la izquierda para destruirlo
    estaFueraDePantalla() {
      return this.x + this.ancho < -20;
    }
  }
  
  ParEdificios.siguienteId = 1;
// no dibuja nada, solo calcula coordenadas y hitboxes

class ParEdificios {
    constructor({ x, centro, hueco, tipo = 1, soloInferior = false, altoEscenario = 585 }) {
      this.id = ParEdificios.siguienteId++;
      this.x = x; /* posicion horizontal donde nace el par de edificios */
      this.ancho = 110; /* ancho del edificio */

      // centro y hueco no los pasa Spawner.js
      this.centro = centro; /* es a que altura en Y se ubica el centro
                              del hueco por el que pasa superman */
      this.hueco = hueco; /* es la distancia entre el techo y el piso del 
                            hueco por donde pasa superman */

      this.tipo = tipo; // 1 a 5 (edificio 1.png ... edificio 5.png)
      this.soloInferior = soloInferior;
      this.altoEscenario = altoEscenario; // 650px total-65px de calle = 585px (el espacio jugable)
  
      this.superado = false; // Para sumar +1 punto una sola vez al pasarlo
      this.elArriba = null;
      this.elAbajo = null;
    }
  
    // sirve para desplazar los edificios de izquierda a derecha
    actualizar(dt, velocidad) {
      this.x -= velocidad * dt;
    }
  
    // Caja del edificio superior (invertido / espejado)
    cajaArriba() {
      if (this.soloInferior) return null; /* si solo esta mostrando el edificio inferior no 
                                             dibujamos el superior */
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
  
    // Devuelve true cuando sale completamente por la izquierda para sacarlo del arreglo
    estaFueraDePantalla() {
      return this.x + this.ancho < -20;
    }
  }
  
  ParEdificios.siguienteId = 1;
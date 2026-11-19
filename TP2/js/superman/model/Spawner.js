class Spawner {
    constructor(anchoEscenario = 1470, altoJugable = 585) {
      this.anchoEscenario = anchoEscenario;
      this.altoJugable = altoJugable; // 650px - 65px de calle
      this.reiniciar();
    }
  
    reiniciar() {
      this.distanciaParaProximo = 120; // Primer edificio aparece rápido al iniciar
      this.ultimoCentro = this.altoJugable / 2;
      this.edificiosGenerados = 0;
    }
  
    azar(min, max) {
      return Math.random() * (max - min) + min;
    }
  
    azarEntero(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  
    actualizar(dt, velocidad, tiempoJugado, estadoJuego, vidasActuales) {
      const nuevosEdificios = [];
      const nuevosItems = [];
  
      this.distanciaParaProximo -= velocidad * dt;
  
      if (this.distanciaParaProximo <= 0) {
        const soloInferior = (estadoJuego === 'menu');
  
        // 1. Hueco vertical se achica progresivamente (de 235px hasta 148px)
        const huecoBase = Math.max(148, 235 - tiempoJugado * 1.6);
        const hueco = huecoBase + this.azar(-12, 12);
  
        // 2. Límites seguros para el centro del hueco
        const margenTecho = 75 + hueco / 2;
        const margenPiso = this.altoJugable - 75 - hueco / 2;
  
        // 3. Evitar saltos imposibles respecto al edificio anterior (máx ±155px)
        const minCentro = Math.max(margenTecho, this.ultimoCentro - 155);
        const maxCentro = Math.min(margenPiso, this.ultimoCentro + 155);
        const centro = this.azar(minCentro, maxCentro);
        this.ultimoCentro = centro;
  
        // 4. Distancia horizontal variable hasta el próximo par de edificios
        const distMin = Math.max(310, 380 - tiempoJugado * 0.8);
        const distMax = Math.max(430, 520 - tiempoJugado * 0.8);
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
  
        // 5. En modo 'jugando', spawnear ítems animados (corazón o kriptonita)
        if (!soloInferior && this.edificiosGenerados >= 2) {
          const xItem = this.anchoEscenario + 20 + distanciaSiguiente * 0.52;
          const yItem = Math.max(60, Math.min(this.altoJugable - 130, centro + this.azar(-85, 85)));
  
          // Si le faltan vidas, hay más chance de que salga un corazón; sino alterna con kriptonita
          const probCorazon = vidasActuales < 3 ? 0.45 : 0.28;
          const roll = Math.random();
  
          if (roll < probCorazon) {
            nuevosItems.push(new ItemAnimado({ x: xItem, y: yItem, tipo: 'corazon' }));
          } else if (roll < probCorazon + 0.52) {
            nuevosItems.push(new ItemAnimado({ x: xItem, y: yItem, tipo: 'kriptonita' }));
          }
        }
      }
  
      return { nuevosEdificios, nuevosItems };
    }
  }
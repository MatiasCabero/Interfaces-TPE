class Tablero {
    constructor(tipoFichaInicial = 'reliquia_oro') {
        this.tipoFichaActual = tipoFichaInicial;
        this.fichas = [];
        // Grilla en forma de Cruz (1 = Casilla válida, 0 = Invalida)
        this.grilla = [
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1], // El centro (3,3) inicia vacío (0)
            [1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0]
        ];
        this.inicializarFichas();
    }

    // Inicializa la disposición completa de piezas
    inicializarFichas() {
        this.fichas = [];
        for (let f = 0; f < 7; f++) {
            for (let c = 0; c < 7; c++) {
                // Solo agrega ficha si es casilla válida Y NO es la casilla central (3,3)
                if (this.grilla[f][c] === 1 && !(f === 3 && c === 3)) {
                    this.fichas.push(new Ficha(f, c, this.tipoFichaActual));
                }
            }
        }
    }

    // Cambia el aspecto/formato de todas las fichas en juego
    cambiarTipoFichas(nuevoTipo) {
        this.tipoFichaActual = nuevoTipo;
        this.fichas.forEach(f => f.tipo = nuevoTipo);
    }

    // Hack de prueba rápida para testear la victoria (Filminas de la cátedra)
    configurarTableroPruebaVictoria() {
        this.fichas = [
            new Ficha(3, 1, this.tipoFichaActual),
            new Ficha(3, 2, this.tipoFichaActual)
        ];
    }

    esCeldaValida(fila, col) {
        return fila >= 0 && fila < 7 && col >= 0 && col < 7 && this.grilla[fila][col] === 1;
    }

    obtenerFicha(fila, col) {
        return this.fichas.find(f => f.fila === fila && f.col === col);
    }

    eliminarFicha(ficha) {
        this.fichas = this.fichas.filter(f => f !== ficha);
    }

    // Valida si un movimiento cumple con la regla de saltear una ficha
    esMovimientoValido(ficha, filaDestino, colDestino) {
        if (!this.esCeldaValida(filaDestino, colDestino)) return false;
        if (this.obtenerFicha(filaDestino, colDestino)) return false; // Destino debe estar libre

        const deltaF = filaDestino - ficha.fila;
        const deltaC = colDestino - ficha.col;

        const esSaltoRecto = (Math.abs(deltaF) === 2 && deltaC === 0) || (Math.abs(deltaC) === 2 && deltaF === 0);
        if (!esSaltoRecto) return false;

        const enElMedio = this.obtenerFicha(ficha.fila + deltaF / 2, ficha.col + deltaC / 2);
        return enElMedio !== undefined; // Debe haber una ficha intermedia para comer
    }

    // Ejecuta el salto y elimina la ficha saltada
    realizarMovimiento(ficha, filaDestino, colDestino) {
        if (!this.esMovimientoValido(ficha, filaDestino, colDestino)) return false;

        const saltada = this.obtenerFicha((ficha.fila + filaDestino) / 2, (ficha.col + colDestino) / 2);
        this.eliminarFicha(saltada);
        ficha.moverA(filaDestino, colDestino);
        return true;
    }

    obtenerMovimientosPosibles(ficha) {
        const direcciones = [
            { df: -2, dc: 0 }, { df: 2, dc: 0 },
            { df: 0, dc: -2 }, { df: 0, dc: 2 }
        ];
        const movimientos = [];
        for (const dir of direcciones) {
            const fila = ficha.fila + dir.df;
            const col = ficha.col + dir.dc;
            if (this.esMovimientoValido(ficha, fila, col)) {
                movimientos.push({ fila, col });
            }
        }
        return movimientos;
    }

    hayMovimientosPosibles() {
        return this.fichas.some(f => this.obtenerMovimientosPosibles(f).length > 0);
    }

    // Se gana UNICAMENTE si queda 1 sola ficha Y esta ubicada en el centro exacto (fila 3, columna 3)
    gano() {
        if (this.fichas.length !== 1) return false;
        const ultimaFicha = this.fichas[0];
        return ultimaFicha.fila === 3 && ultimaFicha.col === 3;
    }
}
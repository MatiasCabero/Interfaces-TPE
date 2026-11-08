// el modelo se encarga de guardar toda la logica del juego (las reglas):
//       -Guarda el estado de la matriz o grilla (dónde hay huecos 1, dónde hay casilleros vacíos 0, etc.)
//       -Almacena la lista de fichas activas con sus posiciones (fila, col) y su tipo (reliquia_oro, reliquia_verde)
//       -Valida las reglas del juego (si un movimiento es válido saltando sobre otra ficha)
//       -Ejecuta los movimientos, actualiza la grilla y mantiene el historial para poder deshacer jugadas
//       -Detecta las condiciones de fin de partida (gano() o hayMovimientosPosibles())

class Tablero {
    constructor(tipoFichaInicial = 'reliquia_oro') {
        this.tipoFichaActual = tipoFichaInicial;
        this.fichas = [];
        this.historial=[];

        // Grilla en forma de Cruz (1 = Casilla válida, 0 = Invalida)
        this.grilla = [
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1], // El centro (3,3) inicia vacío 
            [1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0]
        ];

        this.inicializarFichas();
    }

    // Inicializa la disposición completa de piezas
    // recorre todo el tablero y pone una ficha en cada casilla valida (1) y que no sea el centro
    inicializarFichas() {
        this.fichas = [];
        this.historial = []; // <---  Limpia el historial cada vez que se inicia o reinicia la partida
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

    // Hack de prueba rápida para testear la victoria 
    configurarTableroPruebaVictoria() {
        this.fichas = [
            new Ficha(3, 1, this.tipoFichaActual),
            new Ficha(3, 2, this.tipoFichaActual)
        ];
    }

    // Se fija que las coordenadas no se salgan del tablero de 7x7 y que el casillero sea un 1 en la grilla
    esCeldaValida(fila, col) {
        return fila >= 0 && fila < 7 && col >= 0 && col < 7 && this.grilla[fila][col] === 1;
    }

    // Busca dentro del array this.fichas si hay alguna pieza ubicada exactamente en esa fila y columna. Si la encuentra, 
    // la devuelve; si no, retorna undefined
    obtenerFicha(fila, col) {
        return this.fichas.find(f => f.fila === fila && f.col === col);
    }

    // Saca una ficha del array (filtra el array para quitar la pieza que fue "comida" durante un salto)
    eliminarFicha(ficha) {
        this.fichas = this.fichas.filter(f => f !== ficha);
    }

    // Valida si un movimiento cumple con la regla de saltear una ficha
    //      -valida que la celda de destino exista y sea válida
    //      -valida que la celda de destino esté vacía (si ya hay una ficha ahí, no se puede)
    //      -valida que el movimiento sea un salto exacto de 2 casilleros en línea recta (vertical u horizontal)
    //      -valida que exista una ficha enemiga/compañera justo en el casillero del medio del 
    //       salto (ficha.fila + deltaF / 2)

    esMovimientoValido(ficha, filaDestino, colDestino) {
        if (!this.esCeldaValida(filaDestino, colDestino)) return false;
        if (this.obtenerFicha(filaDestino, colDestino)) return false; // Destino debe estar libre

        const deltaF = filaDestino - ficha.fila; // nos dice cuantos casilleros hacia arriba se movio
        const deltaC = colDestino - ficha.col;   // nos dice cuantos casilleros hacia arriba se movio

        const esSaltoRecto = (Math.abs(deltaF) === 2 && deltaC === 0) || (Math.abs(deltaC) === 2 && deltaF === 0);
        if (!esSaltoRecto) return false;   // math.abs nos da un valor absoluto

        const enElMedio = this.obtenerFicha(ficha.fila + deltaF / 2, ficha.col + deltaC / 2);
        return enElMedio !== undefined; // Debe haber una ficha intermedia para comer
    }

    // Ejecuta el salto y elimina la ficha saltada
    realizarMovimiento(ficha, filaDestino, colDestino) {
        if (!this.esMovimientoValido(ficha, filaDestino, colDestino)) return false;

        const filaOrig = ficha.fila;
        const colOrig = ficha.col;
        const saltada = this.obtenerFicha((filaOrig + filaDestino) / 2, (colOrig + colDestino) / 2);

        // Guardamos el estado pasando el movimiento exacto
        this.guardarEstado(ficha, filaOrig, colOrig, filaDestino, colDestino, saltada);

        this.eliminarFicha(saltada);
        ficha.moverA(filaDestino, colDestino);
        return true;
    }

    // Prueba las 4 direcciones posibles (arriba, abajo, izquierda, derecha a 2 casilleros de distancia) para 
    // una ficha dada y devuelve un array con los destinos válidos (esto se usa en la Vista para dibujar los círculos 
    // punteados de ayuda o hints)

    obtenerMovimientosPosibles(ficha) {
        const direcciones = [
            { df: -2, dc: 0 }/* Saltar 2 casilleros hacia arriba (la columna no cambia) */, { df: 2, dc: 0 }, /* Saltar 2 casilleros hacia abajo */
            { df: 0, dc: -2 }/* Saltar 2 casilleros hacia la izquierda (la fila no cambia) */, { df: 0, dc: 2 }/* Saltar 2 casilleros hacia la derecha */
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

    // Revisa si alguna de todas las fichas que quedan en el tablero tiene al menos un movimiento legal disponible
    hayMovimientosPosibles() {
        return this.fichas.some(f => this.obtenerMovimientosPosibles(f).length > 0);
    }

    // Se gana UNICAMENTE si queda 1 sola ficha Y esta ubicada en el centro exacto (fila 3, columna 3)
    gano() {
        if (this.fichas.length !== 1) return false;
        const ultimaFicha = this.fichas[0];
        return ultimaFicha.fila === 3 && ultimaFicha.col === 3;
    }

    //FUNCIONES PARA EL BOTON DESHACER
    guardarEstado(ficha, filaOrig, colOrig, filaDest, colDest, saltada) {
        if (!this.historial) this.historial = [];
        const snapshot = {
            grilla: this.grilla.map(row => [...row]), /* esto lo recomendo gemini, es una copia profunda de la matriz de la grilla */
            // Guardamos una copia de las fichas y los datos exactos del movimiento
            fichas: this.fichas.map(f => new Ficha(f.fila, f.col, f.tipo)),
            movimiento: {
                fichaTipo: ficha.tipo,
                origFila: filaOrig,
                origCol: colOrig,
                destFila: filaDest,
                destCol: colDest,
                // Guardamos los datos de la ficha que había sido comida para poder revivirla con animación si hace falta
                saltadaTipo: saltada ? saltada.tipo : null,
                saltadaFila: saltada ? saltada.fila : null,
                saltadaCol: saltada ? saltada.col : null
            }
        };
        // crea una matriz totalmente nueva con los mismos números, asegurándose de que si el tablero cambia en el futuro,
        // el "snapshot" (la foto del pasado guardada en el historial) quede intacto y se pueda restaurar sin problemas al 
        // presionar Deshacer
        this.historial.push(snapshot);
    }

    // Saca el último elemento guardado en el historial (pop()) y restaura el estado anterior de la grilla y de las 
    // fichas, permitiendo dar marcha atrás en la partida.
    deshacerMovimiento() {
        if (!this.historial || this.historial.length === 0) return false;

        const estadoAnterior = this.historial.pop();
        this.grilla = estadoAnterior.grilla.map(row => [...row]);
        this.fichas = estadoAnterior.fichas.map(f => new Ficha(f.fila, f.col, f.tipo));

        return true;
    }
}
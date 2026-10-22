class Ficha {
    constructor(fila, col, tipo = 'reliquia_oro') {
        this.fila = fila; // Fila lógica (0 a 6)
        this.col = col;   // Columna lógica (0 a 6)
        this.tipo = tipo; // Tipo/Formatos de ficha (ej: reliquia_oro, reliquia_jade)
    }

    // Método para mover la ficha lógicamente
    moverA(nuevaFila, nuevaCol) {
        this.fila = nuevaFila;
        this.col = nuevaCol;
    }
}
// la unica funcion de la vista es es captar las coordenadas del mouse
// y pintar todo en el <canvas> fotograma a fotograma

class TableroView {
    constructor(canvas, tablero, imagenes = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tablero = tablero;
        this.imagenes = imagenes;

        this.tamCelda = 56; /* tamaño de la celda */
        this.radioFicha = 24; /* tamaño de la ficha */

        this.offsetX = (canvas.width - 7 * this.tamCelda) / 2; /* Sirve para centrar la cruz del tablero exactamente en el medio del canvas */
                        // 7 es el tamaño de la grilla
        this.offsetY = (canvas.height - 7 * this.tamCelda) / 2; /* Sirve para centrar la cruz del tablero exactamente en el medio del canvas */
    }

    // Calcula la posicion exacta ajustando la escala entre el tamaño visible en CSS y la grilla interna del Canvas (1470x650)
    posicionMouse(e) {
        // Como el canvas puede verse más chico o más grande en la página web gracias al CSS, esta 
        // función usa getBoundingClientRect() para calcular una escala de proporción (scaleX y scaleY) 
        // y saber exactamente en qué punto del lienzo interno de píxeles se hizo click
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    // Transforma coordenadas de píxeles (dónde está el mouse) en números de fila y columna de la 
    // matriz (ej: "estás en la fila 3, columna 2"). Se usa Math.floor para redondear hacia abajo
    aCelda(x, y) {
        return {
            fila: Math.floor((y - this.offsetY) / this.tamCelda),
            col: Math.floor((x - this.offsetX) / this.tamCelda)
        };
    }

    // Hace lo inverso. Dado una fila y columna lógica (ej: la celda [3, 3]), 
    // te devuelve el centro exacto en píxeles de esa celda para poder dibujar allí una ficha
    aPixeles(fila, col) {
        return {
            x: this.offsetX + col * this.tamCelda + this.tamCelda / 2,
            y: this.offsetY + fila * this.tamCelda + this.tamCelda / 2
        };
    }

    dibujarFondo() {
        // Limpiamos el canvas por completo en cada fotograma, 
        // permitiendo que se transparente y se vea la imagen de fondo del contenedor CSS.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Recorre la matriz de 7x7 y, en cada lugar donde hay un 1, dibuja un círculo oscuro con un borde de color
    dibujarHuecos() {
        for (let f = 0; f < 7; f++) {
            for (let c = 0; c < 7; c++) {
                if (this.tablero.grilla[f][c] === 1) {
                    const { x, y } = this.aPixeles(f, c);
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 18, 0, 2 * Math.PI);
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#d97706';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.stroke();
                }
            }
        }
    }

    // pinta las fichas en el canvas, tanto cuando estan quietas como cuando estan levantadas\
    dibujarFicha(tipo, x, y, levantada = false) {
        const ctx = this.ctx;
        const r = this.radioFicha;

        // ctx.save () guarda una "fotografía" de cómo está configurado el pincel en ese instante (colores, sombras, 
        // recortes). Todo lo que modifiquemos de acá en adelante solo afectará a esta ficha en particular. Cuando 
        // terminemos de dibujarla, usaremos ctx.restore() para que el pincel vuelva a estar limpio
        ctx.save();
        
        // efecto de la ficha levantada 
        if (levantada) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 12; /* da el efecto sombra */
        }

        const img = this.imagenes[tipo] || this.imagenes['reliquia_verde'] || this.imagenes['reliquia_oro'];

        if (img) {
            // 1- dibujamos la ficha sin imagen, es decir un circulo
            ctx.beginPath(); /* comienza una nueva ruta de dibujo vacia */
            ctx.arc(x, y, r, 0, 2 * Math.PI); /* Dibuja las fichas SIN IMAGEN con forma de círculo perfecto 
                                                 en la coordenada (x, y) con el radio r de la ficha. */
            ctx.clip(); /* recorta todo lo que no este dentro del circulo que dibujamos */

            // 2- tomamos las dimensiones de la imagen que le pasamos
            const imgWidth = img.naturalWidth || img.width;
            const imgHeight = img.naturalHeight || img.height;
            
            // 3- Reducimos ligeramente el área de muestreo de la imagen fuente (un 70%) 
            //    para recortar solo la fichita redonda de adentro y descartar el borde negro 
            const size = Math.min(imgWidth, imgHeight) * 0.70; /*recortamos la iamgen un 70% para no tener bordes negros*/
            const sx = (imgWidth - size) / 2; /* Calcula el punto exacto de inicio para centrar ese recorte */
            const sy = (imgHeight - size) / 2; /* Calcula el punto exacto de inicio para centrar ese recorte */

            // 4- dibujamos la ficha en la posicion exactas del canvas con las medidas exactas de la ficha y la imagen
            ctx.drawImage(img, sx, sy, size, size, x - r, y - r, r * 2, r * 2);
            
            // 5- dibujamos el borde de la ficha, el color es de acuerdo al tipo de ficha en juego
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.strokeStyle = (tipo === 'reliquia_verde' || tipo === 'reliquia_jade') ? '#10b981' : '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();

        } else {
            // este else lo recomendo gemini, si la imagen tarda en cargar dibuja una ficha de color solido
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = (tipo === 'reliquia_verde' || tipo === 'reliquia_jade') ? '#10b981' : '#f59e0b';
            ctx.fill();
        }
        
        // Restaura los valores originales del canvas que habíamos guardado al principio con ctx.save()
        // Esto sirve para que las sombras y las máscaras de recorte de esta ficha no afecten a la siguiente 
        //ficha que se vaya a dibujar en el próximo ciclo del bucle
        ctx.restore();
    }

    dibujarHints(destinos, tiempo, tipoFicha) {
        // Destinos es un array que viene del MODELO (por medio del controlador) con las coordenadas exactas donde 
        // la ficha tiene permitido saltar.
        // El tiempo viene del controlador, es un contador de tiempo que avanza fotograma a fotograma
        const ctx = this.ctx;
        const pulso = (Math.sin(tiempo * 6) + 1) / 2; /* esto le da el efecto de respiracion a la animacion */
                                                      /* el 6 es la velocidad con que se realiza la animacion */

        // Selecciona el color RGB según si la reliquia es verde o dorada
        const esVerde = (tipoFicha === 'reliquia_verde' || tipoFicha === 'reliquia_jade');
        const colorRgb = esVerde ? '16, 185, 129' : '245, 158, 11'; // Verde esmeralda o Dorado ancestral

        // recorremos los destinos posibles de la ficha que nos mando el modelo
        for (const d of destinos) {
            const { x, y } = this.aPixeles(d.fila, d.col); /* Utiliza la función matemática para transformar las 
                                                              coordenadas lógicas de la matriz (fila, col) en las 
                                                              coordenadas exactas en píxeles del centro de ese casillero 
                                                              en el canvas */

            ctx.save(); /* Guarda el estado actual del pincel para no alterar los estilos de otras partes del juego */
            ctx.setLineDash([4, 4]); // Borde punteado 
            ctx.beginPath(); /* comienza la ruta */
            ctx.arc(x, y, 22, 0, 2 * Math.PI);  /* dibuja el circulo con un radio mayor (22) al de la ficha */
            ctx.strokeStyle = `rgba(${colorRgb}, ${0.4 + pulso * 0.4})`; /* a medida que el hint pulsa, cambia la 
                                                                            opacidad del mismo */
            ctx.lineWidth = 2.5; /* ancho del contorno */
            ctx.stroke();

            ctx.fillStyle = `rgba(${colorRgb}, ${0.15 + pulso * 0.1})`;
            ctx.fill();
            ctx.restore();
        }
    }

    // este es el metodo que se actualiza 60 fps para actualizar lo que el usuario ve en la pantalla
    dibujar(estado = {}) { /* el metodo recibe un objeto que le pasa el controlador con toda la info del momento actual */

        const { arrastre = null, tiempo = 0 } = estado; /* es la info de la ficha que el usuario tiene clickeada
                                                           si es que la hay */

        this.ctx.save(); /* guarda la foto del estado global del CANVAS antes de empezar a dibujar todo el fotograma */

        // Limpiamos el canvas por completo en cada fotograma, 
        this.dibujarFondo(); /* borra todo lo que se dibujo en el fotograma anterior */
        this.dibujarHuecos(); /* dibujas los huecos */

        // recorremos la lista de todas las fichas que estan guardadas en el modelo
        for (const ficha of this.tablero.fichas) {
            if (arrastre && ficha === arrastre.ficha) continue; /* si el usuario tiene una ficha levantada esta se salta
                                                                    y no se dibuja en su lugar original */

            // para el resto de las fichas se calcula su posicion exacta en pixeles y se la dibuja
            const { x, y } = this.aPixeles(ficha.fila, ficha.col);
            this.dibujarFicha(ficha.tipo, x, y);
        }

        // Si el usuario tiene una ficha arrastrada:
        //      -pasamos el tipo de ficha a los hints para que tome su color dinámico
        if (arrastre && arrastre.destinos) {
            this.dibujarHints(arrastre.destinos, tiempo, arrastre.ficha.tipo);
        }

        // dibujamos la ficha que se esta arrastrando (si la hay)
        if (arrastre) {
            this.dibujarFicha(
                // la ficha se dibuja calculando las coordenafas actuales del mouse
                // y restándoles un desfase para que la ficha quede perfectamente centrada bajo el puntero
                arrastre.ficha.tipo,
                arrastre.x - arrastre.offsetX,
                arrastre.y - arrastre.offsetY,
                true /* este true se usa para el "levantada=true" y darle el efecto sombra*/
            );
        }

        // Restaura los valores originales del canvas para cerrar el ciclo de renderizado de este fotograma
        this.ctx.restore();
    }
}
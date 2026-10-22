class TableroView {
    constructor(canvas, tablero, imagenes = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tablero = tablero;
        this.imagenes = imagenes;

        this.tamCelda = 56;
        this.radioFicha = 24;
        this.offsetX = (canvas.width - 7 * this.tamCelda) / 2;
        this.offsetY = (canvas.height - 7 * this.tamCelda) / 2;
    }

    // Calcula la posicion exacta ajustando la escala entre el tamaño visible en CSS y la grilla interna del Canvas (900x600)
    posicionMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    aCelda(x, y) {
        return {
            fila: Math.floor((y - this.offsetY) / this.tamCelda),
            col: Math.floor((x - this.offsetX) / this.tamCelda)
        };
    }

    aPixeles(fila, col) {
        return {
            x: this.offsetX + col * this.tamCelda + this.tamCelda / 2,
            y: this.offsetY + fila * this.tamCelda + this.tamCelda / 2
        };
    }

    dibujarFondo() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.imagenes.fondo) {
            this.ctx.drawImage(this.imagenes.fondo, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#1e1b18';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

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

    dibujarFicha(tipo, x, y, levantada = false) {
        const ctx = this.ctx;
        const r = this.radioFicha;

        ctx.save();
        
        if (levantada) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 12;
        }

        const img = this.imagenes[tipo] || this.imagenes['reliquia_verde'] || this.imagenes['reliquia_oro'];

        if (img) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.clip();
            ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
            
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.strokeStyle = (tipo === 'reliquia_verde' || tipo === 'reliquia_jade') ? '#10b981' : '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = (tipo === 'reliquia_verde' || tipo === 'reliquia_jade') ? '#10b981' : '#f59e0b';
            ctx.fill();
        }
        
        ctx.restore();
    }

    dibujarHints(destinos, tiempo) {
        const ctx = this.ctx;
        const pulso = (Math.sin(tiempo * 6) + 1) / 2;

        for (const d of destinos) {
            const { x, y } = this.aPixeles(d.fila, d.col);

            ctx.save();
            ctx.setLineDash([4, 4]); // Borde punteado
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + pulso * 0.4})`;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + pulso * 0.1})`;
            ctx.fill();
            ctx.restore();
        }
    }

    dibujar(estado = {}) {
        const { arrastre = null, tiempo = 0, esVictoria = false, esDerrota = false, shaking = false } = estado;

        this.ctx.save();

        // Efecto de sacudida (Screen Shake) en derrota
        if (shaking) {
            const dx = (Math.random() - 0.5) * 8;
            const dy = (Math.random() - 0.5) * 8;
            this.ctx.translate(dx, dy);
        }

        this.dibujarFondo();
        this.dibujarHuecos();

        for (const ficha of this.tablero.fichas) {
            if (arrastre && ficha === arrastre.ficha) continue;
            const { x, y } = this.aPixeles(ficha.fila, ficha.col);
            this.dibujarFicha(ficha.tipo, x, y);
        }

        if (arrastre && arrastre.destinos) {
            this.dibujarHints(arrastre.destinos, tiempo);
        }

        if (arrastre) {
            this.dibujarFicha(
                arrastre.ficha.tipo,
                arrastre.x - arrastre.offsetX,
                arrastre.y - arrastre.offsetY,
                true
            );
        }

        // Overlay de Victoria: Brillo dorado in crescendo progresivo y fluido (sin latido)
        if (esVictoria) {
            // Guardamos el tiempo exacto en el que arrancó la victoria
            if (!this.tiempoInicioVictoria) {
                this.tiempoInicioVictoria = tiempo;
            }

            // Calculamos los segundos transcurridos (de 0 a 2.2 segundos)
            const transcurrido = tiempo - this.tiempoInicioVictoria;
            const duracionTotal = 2.2; 
            const progreso = Math.min(1, Math.max(0, transcurrido / duracionTotal));

            // Curva de suavizado Smoothstep (evita frenos bruscos y da un degradado fluido)
            const progresoSuave = progreso * progreso * (3 - 2 * progreso);

            // La opacidad sube limpiamente desde 0 hasta 0.50 sin vibraciones
            const opacidadFinal = progresoSuave * 0.50;

            this.ctx.fillStyle = `rgba(245, 158, 11, ${opacidadFinal})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.tiempoInicioVictoria = null; // Reinicia cuando se resetea el juego
        }

        // Overlay de Derrota: Tumba oscura y desaturada
        if (esDerrota) {
            this.ctx.fillStyle = 'rgba(10, 8, 20, 0.65)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.ctx.restore();
    }
}
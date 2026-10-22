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

            ctx.strokeStyle = `rgba(245, 158, 11, ${1 - pulso * 0.6})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, this.radioFicha * (0.8 + pulso * 0.3), 0, 2 * Math.PI);
            ctx.stroke();

            const ya = y - this.radioFicha - 8 - pulso * 6;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(x - 8, ya - 10);
            ctx.lineTo(x + 8, ya - 10);
            ctx.lineTo(x, ya);
            ctx.fill();
        }
    }

    dibujar(estado = {}) {
        const { arrastre = null, tiempo = 0 } = estado;

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
    }
}
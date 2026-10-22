// ============================================================================
// CLASE PRINCIPAL DEL CONTROLADOR DEL JUEGO (JuegoCompleto)
// ============================================================================
class JuegoCompleto {
    constructor(canvas, imagenes, tiempoLimite = 900) {
        this.canvas = canvas;
        
        this.tablero = new Tablero();
        this.vista = new TableroView(canvas, this.tablero, imagenes);
        
        this.arrastre = null;
        this.mensaje = null;
        this.esVictoria = false;
        
        this.tiempoLimite = tiempoLimite;
        this.inicio = null;
        this.juegoIniciado = false;

        // Referencias del DOM HTML para controlar Overlays
        this.gameHUD = document.getElementById('gameHUD');
        this.hudTiempo = document.getElementById('hudTiempo');
        this.startOverlay = document.getElementById('startOverlay');
        this.victoryOverlay = document.getElementById('victoryOverlay');
        this.victoryTitle = document.getElementById('victoryTitle');
        this.victoryTimeMsg = document.getElementById('victoryTimeMsg');

        this.alBajar = e => this.onMouseDown(e);
        this.alMover = e => this.onMouseMove(e);
        this.alSoltar = e => this.onMouseUp(e);

        this.canvas.addEventListener('mousedown', this.alBajar);
        window.addEventListener('mousemove', this.alMover);
        window.addEventListener('mouseup', this.alSoltar);

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    /**
     * Inicia la partida tras elegir reliquia en el menu previo
     */
    iniciarPartida(tipoFicha) {
        this.cambiarModeloFicha(tipoFicha);
        this.reiniciarJuegoConOcultamiento();
        this.startOverlay.classList.add('hidden');
        this.gameHUD.classList.remove('hidden');
    }

    /**
     * Abre de nuevo el menu inicial para cambiar de reliquia o reiniciar
     */
    abrirMenuSeleccion() {
        this.reiniciarJuegoConOcultamiento();
        this.gameHUD.classList.add('hidden');
        this.startOverlay.classList.remove('hidden');
    }

    onMouseDown(e) {
        if (this.mensaje) return;

        const p = this.vista.posicionMouse(e);
        const { fila, col } = this.vista.aCelda(p.x, p.y);
        const ficha = this.tablero.obtenerFicha(fila, col);

        if (!ficha) return;

        // Inicia el cronometro en la primera jugada
        if (!this.juegoIniciado) {
            this.juegoIniciado = true;
            this.inicio = performance.now();
        }

        const centro = this.vista.aPixeles(ficha.fila, ficha.col);
        this.arrastre = {
            ficha,
            x: p.x,
            y: p.y,
            offsetX: p.x - centro.x,
            offsetY: p.y - centro.y,
            destinos: this.tablero.obtenerMovimientosPosibles(ficha)
        };
    }

    onMouseMove(e) {
        if (!this.arrastre) return;
        const p = this.vista.posicionMouse(e);
        this.arrastre.x = p.x;
        this.arrastre.y = p.y;
    }

    onMouseUp(e) {
        if (!this.arrastre) return;

        const { ficha, x, y, offsetX, offsetY } = this.arrastre;
        const { fila, col } = this.vista.aCelda(x - offsetX, y - offsetY);

        this.tablero.realizarMovimiento(ficha, fila, col);
        this.arrastre = null;

        this.verificarFin();
    }

    reiniciarJuego() {
        this.tablero.inicializarFichas();
        this.mensaje = null;
        this.esVictoria = false;
        this.arrastre = null;
        this.juegoIniciado = false;
        this.inicio = null;
        this.victoryOverlay.classList.add('hidden');
        if (this.hudTiempo) this.hudTiempo.textContent = "15:00";
    }

    reiniciarJuegoConOcultamiento() {
        this.reiniciarJuego();
        const btnModoPrueba = document.getElementById('btnModoPrueba');
        if (btnModoPrueba) {
            btnModoPrueba.style.display = 'none';
        }
    }

    cambiarModeloFicha(nuevoTipo) {
        this.tablero.cambiarTipoFichas(nuevoTipo);
    }

    activarModoPruebaVictoria() {
        this.tablero.configurarTableroPruebaVictoria();
        this.mensaje = null;
        this.esVictoria = false;
        this.arrastre = null;
        this.juegoIniciado = false;
        this.inicio = null;
        this.victoryOverlay.classList.add('hidden');
    }

    verificarFin() {
        if (this.tablero.gano()) {
            this.mensaje = 'Mision Cumplida. Dejaste la reliquia en el centro.';
            this.esVictoria = true;
            this.mostrarModalFin();
        } else if (!this.tablero.hayMovimientosPosibles()) {
            this.mensaje = 'Sin movimientos. La tumba se ha cerrado.';
            this.esVictoria = false;
            this.mostrarModalFin();
        }
    }

    mostrarModalFin() {
        if (this.victoryTitle && this.victoryTimeMsg) {
            this.victoryTitle.textContent = this.esVictoria ? '¡VICTORIA!' : 'FIN DEL JUEGO';
            this.victoryTimeMsg.textContent = this.mensaje;
        }
        this.victoryOverlay.classList.remove('hidden');
    }

    loop(ahora) {
        let restante = this.tiempoLimite;

        if (this.juegoIniciado && this.inicio !== null && !this.mensaje) {
            const transcurrido = (ahora - this.inicio) / 1000;
            restante = Math.max(0, this.tiempoLimite - transcurrido);

            const mins = Math.floor(restante / 60);
            const segs = Math.floor(restante % 60);
            if (this.hudTiempo) {
                this.hudTiempo.textContent = `${mins}:${segs < 10 ? '0' : ''}${segs}`;
            }

            if (restante === 0) {
                this.mensaje = 'Se agoto el tiempo en la tumba.';
                this.esVictoria = false;
                this.arrastre = null;
                this.mostrarModalFin();
            }
        }

        this.vista.dibujar({
            arrastre: this.arrastre,
            tiempo: ahora / 1000
        });

        requestAnimationFrame(this.loop);
    }
}

function cargarImagen(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvasJuego');
    if (!canvas) return;

    Promise.all([
        cargarImagen('Assets/pegSolitarie/tablero.jpeg'),
        cargarImagen('Assets/pegSolitarie/fichaVerde.jpeg'),
        cargarImagen('Assets/pegSolitarie/fichaOro.jpeg')
    ]).then(([fondo, fichaVerde, fichaOro]) => {

        const juego = new JuegoCompleto(canvas, {
            fondo: fondo,
            reliquia_oro: fichaOro,
            reliquia_verde: fichaVerde,
            reliquia_jade: fichaVerde
        }, 900);

        // Evento del Boton Comenzar en el Menu Inicial
        const btnComenzar = document.getElementById('btnComenzarJuego');
        if (btnComenzar) {
            btnComenzar.addEventListener('click', () => {
                const seleccionada = document.querySelector('input[name="relicChoice"]:checked');
                const tipoFicha = seleccionada ? seleccionada.value : 'reliquia_oro';
                juego.iniciarPartida(tipoFicha);
            });
        }

        // Evento del Boton Cambiar Ficha / Volver al Menu
        const btnVolverMenu = document.getElementById('btnVolverMenu');
        if (btnVolverMenu) {
            btnVolverMenu.addEventListener('click', () => {
                juego.abrirMenuSeleccion();
            });
        }

        // Evento del Boton Volver a Jugar en el Modal
        const btnVolverAJugar = document.getElementById('btnVolverAJugar');
        if (btnVolverAJugar) {
            btnVolverAJugar.addEventListener('click', () => {
                juego.reiniciarJuegoConOcultamiento();
            });
        }

        // Truco Secreto: 5 clics seguidos en Reiniciar revela el boton de prueba
        let clicsReiniciar = 0;
        let timerClics = null;

        const btnReiniciar = document.getElementById('btnReiniciarJuego');
        const btnModoPrueba = document.getElementById('btnModoPrueba');

        if (btnReiniciar) {
            btnReiniciar.addEventListener('click', () => {
                juego.reiniciarJuegoConOcultamiento();

                clicsReiniciar++;
                clearTimeout(timerClics);

                if (clicsReiniciar === 5) {
                    if (btnModoPrueba) {
                        btnModoPrueba.style.display = 'inline-block';
                    }
                    clicsReiniciar = 0;
                } else {
                    timerClics = setTimeout(() => {
                        clicsReiniciar = 0;
                    }, 2500);
                }
            });
        }

        if (btnModoPrueba) {
            btnModoPrueba.addEventListener('click', () => juego.activarModoPruebaVictoria());
        }

    }).catch(err => {
        console.warn("Error cargando texturas...", err);
        const juego = new JuegoCompleto(canvas, {}, 900);
    });
});
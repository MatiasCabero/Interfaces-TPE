// ============================================================================
// CLASE PRINCIPAL DEL CONTROLADOR DEL JUEGO (JuegoCompleto)
// ============================================================================


/* Conecta los eventos del usuario (clics, movimiento del mouse, botones del menú) con el Modelo (Tablero) 
para cambiar las reglas, y con la Vista (TableroView) para reflejar esos cambios en la pantalla a 60 fotogramas 
por segundo */
class JuegoCompleto {
    constructor(canvas, imagenes, tiempoLimite = 900) {
        this.canvas = canvas;
        
        // instanciamos modelo y vista
        this.tablero = new Tablero();
        this.vista = new TableroView(canvas, this.tablero, imagenes);
        
        this.arrastre = null;
        this.mensaje = null;
        this.esVictoria = false;

        this.esDerrota = false;
        this.shaking = false;
        
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

        // escuchamos desde el window para que si el usuario mueve la ficha fuera del canvas este no se rompa
        this.canvas.addEventListener('mousedown', this.alBajar);
        window.addEventListener('mousemove', this.alMover);
        window.addEventListener('mouseup', this.alSoltar);

        this.loop = this.loop.bind(this); /* hacemos referencia a la instancia del juego actual */
        requestAnimationFrame(this.loop);/* funcion nativa de los navegadores para que las animaciones sean fluidas */
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

    // cuando el usuario hace click
    onMouseDown(e) {
        if (this.mensaje) return; /* si aparece algun modal (victoria, derrota, etc) corta la 
                                     funcion e impide que el usuario siga moviendo las fichas */

        const p = this.vista.posicionMouse(e); /* llama a la visa y guarda la posicion del mouse en el lienzo */
        const { fila, col } = this.vista.aCelda(p.x, p.y); /* transforma esas coordenas en píxeles a fila y columna 
                                                              lógica de la matriz del tablero (por ejemplo, fila 2, 
                                                              columna 3)*/
        const ficha = this.tablero.obtenerFicha(fila, col); /* le pregunta al modelo si hay una ficha en esa posicion */

        if (!ficha) return; /* si no hay ninguna ficha corta la funcion */

        // Inicia el cronometro en la primera jugada
        if (!this.juegoIniciado) {
            this.juegoIniciado = true;
            this.inicio = performance.now();
        }

        // Calcula el centro exacto en píxeles donde está dibujada esa ficha en el tablero
        const centro = this.vista.aPixeles(ficha.fila, ficha.col); 

        // se crea el objeto arrastre
        this.arrastre = {
            ficha, /* la ficha que el usuario eligio */
            x: p.x, /* coordenadas actuales del mouse */
            y: p.y, /* coordenadas actuales del mouse */

            /* Son los desfasajes (la distancia exacta entre el centro de la ficha y el lugar 
            reciso donde el usuario hizo clic adentro de ella). Sirve para que la ficha 
            no salte hacia el mouse */
            offsetX: p.x - centro.x, 
            offsetY: p.y - centro.y,

            // le pedimos al modelo los movimientos posibles 
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

    //DESHACER MOVIMIENTO
    deshacer() {
        this.arrastre = null; // Soltamos cualquier ficha del mouse
        if (!this.tablero.historial || this.tablero.historial.length === 0) return;

        // Sacamos el último estado
        const estadoAnterior = this.tablero.historial.pop();
        const mov = estadoAnterior.movimiento;

        // Encontramos la ficha actual que tiene que volver atrás
        const fichaAMover = this.tablero.obtenerFicha(mov.destFila, mov.destCol);
        if (!fichaAMover) {
            // Si por algo no la encuentra, hace un restore directo de emergencia
            this.tablero.grilla = estadoAnterior.grilla.map(row => [...row]);
            this.tablero.fichas = estadoAnterior.fichas.map(f => new Ficha(f.fila, f.col, f.tipo));
            return;
        }

        // Animación fluida de deslizamiento hacia atrás (Duration: ~250ms)
        const inicioAnim = performance.now();
        const duracionAnim = 250; 
        const posOrig = this.vista.aPixeles(mov.destFila, mov.destCol);
        const posDest = this.vista.aPixeles(mov.origFila, mov.origCol);

        // Bloqueamos interacciones mientras anima para que no se rompa nada
        this.mensajeAnimacionDeshacer = true; 

        const animarRetorno = (ahora) => {
            const progreso = Math.min(1, (ahora - inicioAnim) / duracionAnim);
            // Easing suave (Ease Out)
            const ease = 1 - Math.pow(1 - progreso, 3);

            // Coordenadas intermedias para la animación visual temporal
            const xActual = posOrig.x + (posDest.x - posOrig.x) * ease;
            const yActual = posOrig.y + (posDest.y - posOrig.y) * ease;

            // Forzamos a la vista a redibujar la ficha moviéndose de forma fluida
            this.vista.dibujar({
                arrastre: {
                    ficha: fichaAMover,
                    x: xActual + (posDest.x - posOrig.x < 0 ? 0 : 0), // compensación de offset simple
                    y: yActual,
                    offsetX: 0,
                    offsetY: 0,
                    destinos: []
                },
                tiempo: ahora / 1000,
                esVictoria: false,
                esDerrota: false,
                shaking: false
            });

            if (progreso < 1) {
                requestAnimationFrame(animarRetorno);
            } else {
                // Una vez terminada la animación visual, aplicamos el cambio real en el modelo del tablero
                this.tablero.grilla = estadoAnterior.grilla.map(row => [...row]);
                this.tablero.fichas = estadoAnterior.fichas.map(f => new Ficha(f.fila, f.col, f.tipo));
                this.mensaje = null;
                this.esVictoria = false;
                this.esDerrota = false;
                this.shaking = false;
                this.victoryOverlay.classList.add('hidden');
                this.mensajeAnimacionDeshacer = false;
            }
        };

        requestAnimationFrame(animarRetorno);
    }

    reiniciarJuego() {
        this.tablero.inicializarFichas();
        if (this.tablero.historial) this.tablero.historial = [];
        this.mensaje = null;
        this.esVictoria = false;
        this.arrastre = null;

        this.esDerrota = false;
        this.shaking = false;

        //Quitamos el destello al reiniciar
        const gameMedia = document.getElementById('gameMedia');
        if (gameMedia) gameMedia.classList.remove('victory-glow');

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
        this.esDerrota = false;
        this.shaking = false;
        this.arrastre = null;
        this.juegoIniciado = false;
        this.inicio = null;
        this.victoryOverlay.classList.add('hidden');
    }

    verificarFin() {
        const fichasRestantes = this.tablero.fichas.length;

        if (this.tablero.gano()) {
            this.esVictoria = true;
            this.mensaje = `¡Misión Cumplida! Rescataste la reliquia en el centro en ${this.obtenerTiempoTranscurrido()}.`;
            this.mostrarModalFinConRetraso();
        } else if (!this.tablero.hayMovimientosPosibles()) {
            this.esDerrota = true;
            this.shaking = true;
            
            // TIEMPO DE LA VIBRACION
            setTimeout(() => this.shaking = false, 2200); 

            this.mensaje = `Sin movimientos posibles. Te quedaron ${fichasRestantes} reliquias atrapadas en el altar.`;
            this.mostrarModalFinConRetraso();
        }
    }

    obtenerTiempoTranscurrido() {
        if (!this.inicio) return "0s";
        const segsTotales = Math.floor((performance.now() - this.inicio) / 1000);
        const m = Math.floor(segsTotales / 60);
        const s = segsTotales % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

    
    //Muestra el modal con retraso para apreciar la jugada final
    mostrarModalFinConRetraso() {
        setTimeout(() => {
            this.mostrarModalFin();
        }, 2200);
    }

    mostrarModalFin() {
        if (this.victoryTitle && this.victoryTimeMsg) {
            this.victoryTitle.textContent = this.esVictoria ? '¡Victoria!' : 'Fin del juego';
            this.victoryTimeMsg.textContent = this.mensaje;
        }
        this.victoryOverlay.classList.remove('hidden');
    }

    //========================================================================================
    //ESTE METODO HACE QUE EL JUEGO SE RENDERIZE A 60FPS Y NO QUEDE LA IMAGEN ESTATICA
    //esto ayuda a que cuando movemos una ficha se dibuje su nueva posicion
    //========================================================================================

    loop(ahora) {
        // 1. Declaramos la variable local para manejar el tiempo restante de la partida
        let restante = this.tiempoLimite;

        // 2. Verificamos si el juego ya arrancó, si el cronómetro tiene inicio y si no hay ningún cartel/mensaje bloqueando la jugabilidad
        if (this.juegoIniciado && this.inicio !== null && !this.mensaje) {
            
            // Calculamos cuánto tiempo pasó desde que empezó la partida (en segundos)
            const transcurrido = (ahora - this.inicio) / 1000;
            
            // Restamos el tiempo transcurrido del límite total (asegurándonos de que nunca baje de 0)
            restante = Math.max(0, this.tiempoLimite - transcurrido);

            // Convertimos los segundos restantes en formato de minutos y segundos (ej: 14:59)
            const mins = Math.floor(restante / 60);
            const segs = Math.floor(restante % 60);
            
            // Actualizamos el texto del HUD en pantalla con el tiempo que va quedando
            if (this.hudTiempo) {
                this.hudTiempo.textContent = `${mins}:${segs < 10 ? '0' : ''}${segs}`;
            }

            // Si el cronómetro llega a 0, se gatilla la derrota por tiempo agotado
            if (restante === 0) {
                this.esDerrota = true;
                this.mensaje = 'Se agotó el tiempo. La tumba ancestral se ha cerrado.';
                this.arrastre = null;
                this.mostrarModalFin(); // Mostramos el cartel de fin de juego
            }
        }

        // 3. Evaluamos fotograma a fotograma si el jugador perdio o gano para activar los efectos
        const gameMedia = document.getElementById('gameMedia');
        if (gameMedia) {
            if (this.shaking) {
                gameMedia.classList.add('shaking'); // Activa la animación de sacudida en todo el contenedor
            } else {
                gameMedia.classList.remove('shaking'); // La remueve cuando termina de vibrar
            }

            if (this.esVictoria) {
                gameMedia.classList.add('victory-glow');
            } else {
                gameMedia.classList.remove('victory-glow');
            }
        }

        // 4. Mandamos a dibujar todos los elementos visuales actualizados en el Canvas 
        // (fondo transparente, huecos, fichas y ayudas/hints)
        this.vista.dibujar({
            arrastre: this.arrastre,
            tiempo: ahora / 1000,
            esVictoria: this.esVictoria,
            esDerrota: this.esDerrota,
            shaking: this.shaking
        });

        // 5. Volvemos a llamar a `loop` inmediatamente para renderizar el siguiente fotograma 
        // (creando así la fluidez visual de 60 FPS)
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

        //Boton deshacer
        const btnDeshacer = document.getElementById('btnDeshacer');
        if (btnDeshacer) {
            btnDeshacer.addEventListener('click', () => {
                juego.deshacer();
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
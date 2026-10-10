// el contexto (ctx) es el conjunto de herramietas que uso para dibujar sobre el canvas
// imageData es una estructura de datos (un objeto) que guarda todos los píxeles de una imagen o 
// del canvas cargados en la memoria RAM.   
//
// Contiene tres datos principales:   
//          width: El ancho de la imagen.   
//          height: El alto de la imagen.   
//          data: Un arreglo gigante de números donde cada píxel está representado por 4 números seguidos (Rojo, Verde, 
//          Azul, Alfa).   
//
// La analogía del taller de pintura:
//      El canvas: Es el cuadro colgado en la pared.
//      imageData: Es una foto digital exacta de ese cuadro guardada en tu memoria. 
//      Vos podés cambiarle los colores a la foto en tu memoria todo lo que quieras, pero el cuadro 
//      de la pared (canvas) no cambia hasta que ejecutes ctx.putImageData() para "planchar" tus cambios en la 
//      pantalla. 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtenemos las referencias del DOM
    const contenedor = document.getElementById('gameMedia');
    const canvas = document.getElementById('miLienzo');
    const ctx = canvas.getContext('2d');

    // 2. Ajustamos la resolución interna del Canvas a las medidas reales del contenedor CSS
    canvas.width = contenedor.clientWidth;
    canvas.height = contenedor.clientHeight;

    const bancoDeImagenes = [
        'Assets/blocka/astronauta.jpeg',
        'Assets/blocka/auto.jpeg',
        'Assets/blocka/ciudad.jpeg',
        'Assets/blocka/faro.jpeg',
        'Assets/blocka/leon.jpeg',
        'Assets/blocka/robot.jpeg'
    ];

    // Elementos de la interfaz HTML
    let btnComenzar = document.getElementById('btnComenzar');
    const gameOverlay = document.getElementById('gameOverlay');
    const victoryOverlay = document.getElementById('victoryOverlay');
    const victoryTitle = document.getElementById('victoryTitle');
    const victoryTimeMsg = document.getElementById('victoryTimeMsg');
    let thumbsRuleta = document.querySelectorAll('.roulette-thumb');

    const gameHUD = document.getElementById('gameHUD');
    const hudNivel = document.getElementById('hudNivel');
    const hudTiempo = document.getElementById('hudTiempo');
    const btnAyuda = document.getElementById('btnAyuda');
    const btnReiniciarHUD = document.getElementById('btnReiniciarHUD');
    const btnVolverHUD = document.getElementById('btnVolverHUD');

    const btnSiguienteNivel = document.getElementById('btnSiguienteNivel');
    const btnVolverMenu = document.getElementById('btnVolverMenu');

    // Selección de Piezas (Solo configurable en Nivel 1)
    let piezasSelectorContainer = document.querySelector('.piezas-selector');
    let btnsPiezas = document.querySelectorAll('.btn-piezas');
    let cantidadPiezas = 4;
    let cantFilas = 2;
    let cantColumnas = 2;

    // Guardamos el HTML original de la ruleta apenas carga la página
    if (!gameOverlay.getAttribute('data-original-html')) {
        gameOverlay.setAttribute('data-original-html', gameOverlay.innerHTML);
    }

    function inicializarEventosRuleta() {
        btnComenzar = document.getElementById('btnComenzar');
        thumbsRuleta = document.querySelectorAll('.roulette-thumb');
        piezasSelectorContainer = document.querySelector('.piezas-selector');
        btnsPiezas = document.querySelectorAll('.btn-piezas');

        if (btnComenzar) {
            btnComenzar.disabled = false;
            btnComenzar.addEventListener('click', () => {
                btnComenzar.disabled = true;
                ejecutarRuleta();
            });
        }

        btnsPiezas.forEach(btn => {
            btn.addEventListener('click', () => {
                btnsPiezas.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                cantidadPiezas = parseInt(btn.getAttribute('data-piezas'));
                if (cantidadPiezas === 4) {
                    cantFilas = 2; cantColumnas = 2;
                } else if (cantidadPiezas === 6) {
                    cantFilas = 2; cantColumnas = 3;
                } else if (cantidadPiezas === 8) {
                    cantFilas = 2; cantColumnas = 4;
                }
            });
        });
    }

    inicializarEventosRuleta();

    // Variables de estado del juego
    let nivelActual = 1; // 1: Grises, 2: Brillo, 3: Negativo, 4: Aleatorio + Tiempo límite (35s)
    let piezas = [];
    let imagenActual = new Image();
    let rutaImagenActual = '';
    let juegoGanado = false;
    let juegoPerdido = false;
    const angulosPosibles = [90, 180, 270];

    // Variables del cronómetro
    let segundosTranscurridos = 0;
    const TIEMPO_MAX_NIVEL4 = 35; // Límite de tiempo en segundos para el nivel 4
    let intervaloCronometro = null;

    // Dimensiones y centrado del tablero dentro del canvas
    let tableroAncho = 0;
    let tableroAlto = 0;
    let offsetX = 0;
    let offsetY = 0;

    btnAyuda.addEventListener('click', () => {
        if (!juegoGanado && !juegoPerdido) aplicarAyudita();
    });

    // Botón del HUD: Reiniciar Imagen y Cronómetro
    btnReiniciarHUD.addEventListener('click', () => {
        if (rutaImagenActual) {
            juegoGanado = false;
            juegoPerdido = false;
            crearPiezas();
            iniciarCronometro();
            dibujarTablero();
        }
    });

    // Botón del HUD: Volver al Menú Principal
    btnVolverHUD.addEventListener('click', () => {
        volverAlMenuInicial();
    });

    btnSiguienteNivel.addEventListener('click', () => {
        if (juegoPerdido) {
            juegoPerdido = false;
        } else {
            nivelActual = nivelActual < 4 ? nivelActual + 1 : 1;
        }

        victoryOverlay.classList.add('hidden');
        prepararOverlayRuleta();
        gameOverlay.classList.remove('hidden');
    });

    btnVolverMenu.addEventListener('click', () => {
        volverAlMenuInicial();
    });

    function volverAlMenuInicial() {
        nivelActual = 1;
        juegoPerdido = false;
        juegoGanado = false;
        detenerCronometro();

        victoryOverlay.classList.add('hidden');
        gameHUD.classList.add('hidden');

        // Restauramos el HTML original de la ruleta por si estaba la vista previa
        const htmlOriginal = gameOverlay.getAttribute('data-original-html');
        if (htmlOriginal) {
            gameOverlay.innerHTML = htmlOriginal;
            inicializarEventosRuleta();
        }

        prepararOverlayRuleta();
        gameOverlay.classList.remove('hidden');
    }

    // Muestra u oculta la selección de piezas según si es el Nivel 1 o un nivel avanzado
    function prepararOverlayRuleta() {
        if (nivelActual === 1) {
            if (piezasSelectorContainer) piezasSelectorContainer.style.display = 'flex';
        } else {
            if (piezasSelectorContainer) piezasSelectorContainer.style.display = 'none';
        }
        if (btnComenzar) btnComenzar.disabled = false;
    }

    // Animación de ruleta de selección previa
    function ejecutarRuleta() {
        let indiceActual = 0;
        let vueltas = 0;
        let velocidad = 50;
        const minVueltas = 18 + Math.floor(Math.random() * 8);

        function pasoRuleta() {
            thumbsRuleta.forEach(t => t.classList.remove('active-roulette'));
            if (thumbsRuleta[indiceActual]) {
                thumbsRuleta[indiceActual].classList.add('active-roulette');
            }

            vueltas++;

            if (vueltas < minVueltas) {
                indiceActual = (indiceActual + 1) % thumbsRuleta.length;
                velocidad += 10;
                setTimeout(pasoRuleta, velocidad);
            } else {
                const imagenElegida = bancoDeImagenes[indiceActual];

                setTimeout(() => {
                    mostrarVistaPreviaImagen(imagenElegida, () => {
                        gameOverlay.classList.add('hidden');
                        iniciarNivel(imagenElegida);
                    });
                }, 400);
            }
        }

        pasoRuleta();
    }

    // Vista previa agrandada previa al desarmado
    function mostrarVistaPreviaImagen(rutaImagen, callbackAlTerminar) {
        gameOverlay.innerHTML = `
            <div class="preview-container">
                <h2 class="roulette-title">¡Esta es tu imagen! </h2>
                <img src="${rutaImagen}" alt="Imagen seleccionada" class="preview-img">
                <p style="margin: 0; color: #64748b; font-size: 0.9rem; font-weight: 600;">Memorizala bien... ¡comenzando!</p>
            </div>
        `;

        setTimeout(() => {
            callbackAlTerminar();
            
            setTimeout(() => {
                const htmlOriginal = gameOverlay.getAttribute('data-original-html');
                if (htmlOriginal) {
                    gameOverlay.innerHTML = htmlOriginal;
                    inicializarEventosRuleta();
                }
            }, 300);
        }, 3000);
    }

    function iniciarNivel(rutaImagen) {
        juegoGanado = false;
        juegoPerdido = false;
        rutaImagenActual = rutaImagen;
        imagenActual = new Image();
        imagenActual.src = rutaImagen;

        hudNivel.textContent = `${nivelActual} (${cantColumnas}x${cantFilas})`;
        gameHUD.classList.remove('hidden');

        imagenActual.onload = () => {
            calcularDimensionesTablero();
            crearPiezas();
            iniciarCronometro();
            dibujarTablero();
        };
    }

    // Control del cronómetro
    function iniciarCronometro() {
        segundosTranscurridos = 0;
        actualizarTextoCronometro();
        if (intervaloCronometro) clearInterval(intervaloCronometro);

        intervaloCronometro = setInterval(() => {
            if (!juegoGanado && !juegoPerdido) {
                segundosTranscurridos++;
                actualizarTextoCronometro();

                if (nivelActual === 4 && segundosTranscurridos >= TIEMPO_MAX_NIVEL4) {
                    procesarDerrota();
                }
            }
        }, 1000);
    }

    function detenerCronometro() {
        if (intervaloCronometro) {
            clearInterval(intervaloCronometro);
            intervaloCronometro = null;
        }
    }

    function actualizarTextoCronometro() {
        if (nivelActual === 4) {
            hudTiempo.textContent = `${obtenerTiempoFormateado(segundosTranscurridos)} / ${obtenerTiempoFormateado(TIEMPO_MAX_NIVEL4)}`;
        } else {
            hudTiempo.textContent = obtenerTiempoFormateado(segundosTranscurridos);
        }
    }

    function obtenerTiempoFormateado(segundosTotal) {
        const mins = Math.floor(segundosTotal / 60);
        const segs = segundosTotal % 60;
        const minsStr = mins < 10 ? `0${mins}` : mins;
        const segsStr = segs < 10 ? `0${segs}` : segs;
        return `${minsStr}:${segsStr}`;
    }

    function aplicarAyudita() {
        const piezaDesacomodada = piezas.find(p => p.angulo !== 0);
        if (piezaDesacomodada) {
            piezaDesacomodada.angulo = 0;
            segundosTranscurridos += 5;
            actualizarTextoCronometro();
            dibujarTablero();

            if (nivelActual === 4 && segundosTranscurridos >= TIEMPO_MAX_NIVEL4) {
                procesarDerrota();
            } else {
                verificarVictoria();
            }
        }
    }

    function calcularDimensionesTablero() {
        const escala = 0.65;
        const maxAncho = Math.floor(canvas.width * escala);
        const maxAlto = Math.floor(canvas.height * escala);

        const proporcionImagen = imagenActual.width / imagenActual.height;
        
        if (maxAncho / maxAlto > proporcionImagen) {
            tableroAlto = maxAlto;
            tableroAncho = Math.floor(maxAlto * proporcionImagen);
        } else {
            tableroAncho = maxAncho;
            tableroAlto = Math.floor(maxAncho / proporcionImagen);
        }

        offsetX = Math.floor((canvas.width - tableroAncho) / 2);
        offsetY = Math.floor((canvas.height - tableroAlto) / 2);
    }

    window.addEventListener('resize', () => {
        canvas.width = contenedor.clientWidth;
        canvas.height = contenedor.clientHeight;

        if (imagenActual.complete && imagenActual.src) {
            calcularDimensionesTablero();
            const anchoPieza = Math.floor(tableroAncho / cantColumnas);
            const altoPieza = Math.floor(tableroAlto / cantFilas);

            piezas.forEach(pieza => {
                pieza.x = offsetX + (pieza.col * anchoPieza);
                pieza.y = offsetY + (pieza.fila * altoPieza);
                pieza.ancho = anchoPieza;
                pieza.alto = altoPieza;
            });

            dibujarTablero();
        }
    });

    function crearPiezas() {
        piezas = [];
        const anchoPieza = Math.floor(tableroAncho / cantColumnas);
        const altoPieza = Math.floor(tableroAlto / cantFilas);
        const listaFiltros = ['grises', 'brillo', 'negativo'];

        for (let fila = 0; fila < cantFilas; fila++) {
            for (let col = 0; col < cantColumnas; col++) {

                const anguloAleatorio = angulosPosibles[Math.floor(Math.random() * angulosPosibles.length)];
                const filtroAleatorio = listaFiltros[Math.floor(Math.random() * listaFiltros.length)];

                piezas.push({
                    fila: fila,
                    col: col,
                    x: offsetX + (col * anchoPieza),
                    y: offsetY + (fila * altoPieza),
                    ancho: anchoPieza,
                    alto: altoPieza,
                    angulo: anguloAleatorio,
                    filtroNivel4: filtroAleatorio
                });
            }
        }
    }

    function dibujarTablero() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#D4EBF8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const anchoImgPieza = Math.floor(imagenActual.width / cantColumnas);
        const altoImgPieza = Math.floor(imagenActual.height / cantFilas);

        const MARGEN_SOLAPAMIENTO = 1.2;

        piezas.forEach((pieza) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = anchoImgPieza;
            tempCanvas.height = altoImgPieza;
            const tempCtx = tempCanvas.getContext('2d');

            tempCtx.drawImage(
                imagenActual,
                pieza.col * anchoImgPieza, pieza.fila * altoImgPieza,
                anchoImgPieza, altoImgPieza,
                0, 0,
                anchoImgPieza, altoImgPieza
            );

            if (!juegoGanado) {
                try {
                    let imgData = tempCtx.getImageData(0, 0, anchoImgPieza, altoImgPieza);
                    aplicarFiltroSegunNivel(imgData, pieza);
                    tempCtx.putImageData(imgData, 0, 0);
                } catch (e) {
                    console.warn("Usa Live Server para probar los filtros píxel por píxel.", e);
                }
            }

            ctx.save();

            const centroX = pieza.x + pieza.ancho / 2;
            const centroY = pieza.y + pieza.alto / 2;
            ctx.translate(centroX, centroY);  
            ctx.rotate((pieza.angulo * Math.PI) / 180);

            ctx.drawImage(
                tempCanvas,
                -pieza.ancho / 2 - MARGEN_SOLAPAMIENTO / 2,
                -pieza.alto / 2 - MARGEN_SOLAPAMIENTO / 2,
                pieza.ancho + MARGEN_SOLAPAMIENTO,
                pieza.alto + MARGEN_SOLAPAMIENTO
            );

            ctx.restore();
        });
    }

    canvas.addEventListener('click', (e) => {
        if (!juegoGanado && !juegoPerdido) procesarClick(e, -90);
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!juegoGanado && !juegoPerdido) procesarClick(e, 90);
    });

    function procesarClick(event, grados) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        piezas.forEach(pieza => {
            if (
                mouseX >= pieza.x && mouseX <= pieza.x + pieza.ancho &&
                mouseY >= pieza.y && mouseY <= pieza.y + pieza.alto
            ) {
                pieza.angulo = (pieza.angulo + grados + 360) % 360;
                dibujarTablero();
                verificarVictoria();
            }
        });
    }

    function verificarVictoria() {
        const estaArmado = piezas.every(pieza => pieza.angulo === 0);

        if (estaArmado) {
            juegoGanado = true;
            detenerCronometro();
            dibujarTablero();

            setTimeout(() => {
                victoryTitle.textContent = "¡Nivel Completado! ";
                victoryTimeMsg.innerHTML = `Tiempo total: <strong id="timeResult">${obtenerTiempoFormateado(segundosTranscurridos)}</strong>`;
                btnSiguienteNivel.textContent = "Siguiente Nivel ➔";
                victoryOverlay.classList.remove('hidden');
            }, 2000);
        }
    }

    function procesarDerrota() {
        juegoPerdido = true;
        detenerCronometro();

        setTimeout(() => {
            victoryTitle.textContent = "¡Tiempo Agotado! ⏳";
            victoryTimeMsg.innerHTML = `Llegaste al límite de <strong>35 segundos</strong> sin armar la imagen.`;
            btnSiguienteNivel.textContent = "Reintentar Nivel 4 🔄";
            victoryOverlay.classList.remove('hidden');
        }, 200);
    }

    function aplicarEscalaDeGrises(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const gris = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i]     = gris;
            data[i + 1] = gris;
            data[i + 2] = gris;
        }
    }

    function aplicarBrillo(imageData, incremento = 60) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i]     = Math.min(255, data[i] + incremento);
            data[i + 1] = Math.min(255, data[i + 1] + incremento);
            data[i + 2] = Math.min(255, data[i + 2] + incremento);
        }
    }

    function aplicarNegativo(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i]     = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }

    function aplicarFiltroSegunNivel(imageData, pieza) {
        if (nivelActual === 1) {
            aplicarEscalaDeGrises(imageData);
        } else if (nivelActual === 2) {
            aplicarBrillo(imageData, 60);
        } else if (nivelActual === 3) {
            aplicarNegativo(imageData);
        } else if (nivelActual === 4) {
            if (pieza.filtroNivel4 === 'grises') aplicarEscalaDeGrises(imageData);
            else if (pieza.filtroNivel4 === 'brillo') aplicarBrillo(imageData, 60);
            else if (pieza.filtroNivel4 === 'negativo') aplicarNegativo(imageData);
        }
    }
});
// el contexto (ctx) es el conjunto de herramientas que uso para dibujar sobre el canvas
// imageData es una estructura de datos (un objeto) que guarda todos los píxeles de una imagen o 
// del canvas cargados en la memoria RAM.   
//
// Contiene tres datos principales:   
//          width: El ancho de la imagen.   
//          height: El alto de la imagen.   
//          data: Un arreglo gigante de números donde cada píxel está representado por 4 números seguidos (Rojo, Verde, Azul, Alfa).

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

    // Selección de Piezas / Dificultad (Solo configurable en Nivel 1)
    let piezasSelectorContainer = document.querySelector('.piezas-selector');
    let btnsPiezas = document.querySelectorAll('.btn-piezas');
    let cantidadPiezas = 4;
    let cantFilas = 2;
    let cantColumnas = 2;

    // Guardamos el HTML original de la ruleta apenas carga la página en memoria RAM
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
    let nivelActual = 1;
    let piezas = [];
    let imagenActual = new Image();
    let rutaImagenActual = '';
    let juegoGanado = false;
    let juegoPerdido = false;
    let primerClicRealizado = false; 
    const angulosPosibles = [90, 180, 270];

    // Historial de tiempos para los 4 niveles de la dificultad actual
    let tiemposPorNivel = [0, 0, 0, 0];

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

    btnReiniciarHUD.addEventListener('click', () => {
        if (rutaImagenActual) {
            juegoGanado = false;
            juegoPerdido = false;
            primerClicRealizado = false;
            detenerCronometro();
            segundosTranscurridos = 0;
            actualizarTextoCronometro();
            crearPiezas();
            dibujarTablero();
        }
    });

    // Botón del HUD: Volver al Menú Principal
    btnVolverHUD.addEventListener('click', () => {
        volverAlMenuInicial();
    });

    // Botón Siguiente Nivel / Aumentar Dificultad
    btnSiguienteNivel.addEventListener('click', () => {
        if (juegoPerdido) {
            juegoPerdido = false;
        } else {
            if (nivelActual < 4) {
                nivelActual++;
            } else {
                // Al terminar el Nivel 4, avanzamos la dificultad automáticamente
                if (cantidadPiezas === 4) {
                    cantidadPiezas = 6;
                    cantFilas = 2; cantColumnas = 3;
                } else if (cantidadPiezas === 6) {
                    cantidadPiezas = 8;
                    cantFilas = 2; cantColumnas = 4;
                } else {
                    // Si completó el juego en Difícil, reinicia a Fácil
                    cantidadPiezas = 4;
                    cantFilas = 2; cantColumnas = 2;
                }
                nivelActual = 1;
                tiemposPorNivel = [0, 0, 0, 0];
            }
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
        tiemposPorNivel = [0, 0, 0, 0];
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
                    mostrarVistaPreviaImagen(imagenElegida);
                }, 400);
            }
        }

        pasoRuleta();
    }

    // Vista previa agrandada e inicio fluido en segundo plano
    function mostrarVistaPreviaImagen(rutaImagen) {
        // 1. Inyectamos la tarjeta de vista previa
        gameOverlay.innerHTML = `
            <div class="preview-container">
                <h2 class="roulette-title">¡Esta es tu imagen! </h2>
                <img src="${rutaImagen}" alt="Imagen seleccionada" class="preview-img">
                <p style="margin: 0; color: #64748b; font-size: 0.9rem; font-weight: 600;">Memorizala bien... ¡comenzando!</p>
            </div>
        `;

        // 2. Cargamos y preparamos el nivel por debajo MIENTRAS se muestra la foto
        iniciarNivel(rutaImagen);

        // 3. Tras 2.5s desvanecemos el overlay suavemente
        setTimeout(() => {
            gameOverlay.classList.add('fade-out');

            setTimeout(() => {
                gameOverlay.classList.add('hidden');
                gameOverlay.classList.remove('fade-out');

                // Restauramos el HTML de la ruleta en segundo plano para la próxima vez
                setTimeout(() => {
                    const htmlOriginal = gameOverlay.getAttribute('data-original-html');
                    if (htmlOriginal) {
                        gameOverlay.innerHTML = htmlOriginal;
                        inicializarEventosRuleta();
                    }
                }, 200);
            }, 400);

        }, 2500);
    }

    function iniciarNivel(rutaImagen) {
        juegoGanado = false;
        juegoPerdido = false;
        primerClicRealizado = false; // Reseteamos la bandera para el nuevo nivel
        rutaImagenActual = rutaImagen;

        hudNivel.textContent = `${nivelActual} (${cantColumnas}x${cantFilas})`;
        gameHUD.classList.remove('hidden');

        // Detenemos cualquier cronómetro previo y mostramos 00:00
        detenerCronometro();
        segundosTranscurridos = 0;
        actualizarTextoCronometro();

        imagenActual = new Image();
        imagenActual.src = rutaImagen;

        imagenActual.onload = () => {
            calcularDimensionesTablero();
            crearPiezas();
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
                // Si es la primera vez que toca una pieza en este nivel, arranca el reloj
                if (!primerClicRealizado) {
                    primerClicRealizado = true;
                    iniciarCronometro();
                }

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

            // Guardamos el tiempo del nivel actual en el arreglo
            tiemposPorNivel[nivelActual - 1] = segundosTranscurridos;

            setTimeout(() => {
                const tiempoTexto = obtenerTiempoFormateado(segundosTranscurridos);

                // Lógica de Récord personal
                const claveRecord = `blocka_record_diff_${cantidadPiezas}_nivel_${nivelActual}`;
                const mejorTiempoPrevio = localStorage.getItem(claveRecord);
                let esNuevoRecord = false;

                if (!mejorTiempoPrevio || segundosTranscurridos < parseInt(mejorTiempoPrevio)) {
                    localStorage.setItem(claveRecord, segundosTranscurridos);
                    esNuevoRecord = true;
                }

                let textoHTML = "";
                if (esNuevoRecord) {
                    textoHTML = ` ¡Nuevo récord: <strong>${tiempoTexto}</strong>!`;
                } else {
                    const tiempoPrevioTexto = obtenerTiempoFormateado(parseInt(mejorTiempoPrevio));
                    textoHTML = `Terminado en <strong>${tiempoTexto}</strong> <br><small class="record-subtext">(Tu mejor récord: ${tiempoPrevioTexto})</small>`;
                }

                // -------------------------------------------------------------
                // CASO A: Niveles 1, 2 y 3
                // -------------------------------------------------------------
                if (nivelActual < 4) {
                    const siguienteNivelNum = nivelActual + 1;
                    victoryTitle.textContent = `¡Nivel ${nivelActual} Completado! `;
                    if (victoryTimeMsg) victoryTimeMsg.innerHTML = textoHTML;
                    btnSiguienteNivel.textContent = `Siguiente Nivel: ${siguienteNivelNum} ➔`;
                } 
                // -------------------------------------------------------------
                // CASO B: Completó Nivel 4 en Dificultad FÁCIL (4 pzs) o MEDIA (6 pzs)
                // -------------------------------------------------------------
                else if (nivelActual === 4 && cantidadPiezas < 8) {
                    const nombreDificultadActual = cantidadPiezas === 4 ? "Fácil" : "Media";
                    const proximaDificultad = cantidadPiezas === 4 ? "Media" : "Difícil";

                    victoryTitle.textContent = `¡Dificultad ${nombreDificultadActual} Completada! `;
                    
                    let desgloseTiempos = `
                        <div class="summary-container">
                            <p style="margin-bottom: 8px;"><strong>Tiempos en esta dificultad:</strong></p>
                            <ul class="summary-list">
                                <li>Nivel 1: <strong>${obtenerTiempoFormateado(tiemposPorNivel[0])}</strong></li>
                                <li>Nivel 2: <strong>${obtenerTiempoFormateado(tiemposPorNivel[1])}</strong></li>
                                <li>Nivel 3: <strong>${obtenerTiempoFormateado(tiemposPorNivel[2])}</strong></li>
                                <li>Nivel 4: <strong>${obtenerTiempoFormateado(tiemposPorNivel[3])}</strong></li>
                            </ul>
                            <p class="record-subtext" style="margin-top: 10px; color: #2563eb; font-weight: 700;">
                                ¡Excelente trabajo! ¿Te animás a subir el desafío?
                            </p>
                        </div>
                    `;

                    if (victoryTimeMsg) victoryTimeMsg.innerHTML = desgloseTiempos;
                    btnSiguienteNivel.textContent = `Aumentar Dificultad (${proximaDificultad}) `;
                } 
                // -------------------------------------------------------------
                // CASO C: Completó Nivel 4 en Dificultad DIFÍCIL (8 pzs) - ¡FINAL 100%!
                // -------------------------------------------------------------
                else if (nivelActual === 4 && cantidadPiezas === 8) {
                    victoryTitle.textContent = "¡JUEGO COMPLETADO AL 100%! ";

                    let desgloseFinal = `
                        <div class="summary-container">
                            <p style="color: #16a34a; font-weight: 800; font-size: 1.1rem; margin-bottom: 8px;">
                                ¡Sos un genio absoluto! Lograste superar todas las dificultades.
                            </p>
                            <p style="margin-bottom: 6px;"><strong>Tiempos en Dificultad Difícil:</strong></p>
                            <ul class="summary-list">
                                <li>Nivel 1: <strong>${obtenerTiempoFormateado(tiemposPorNivel[0])}</strong></li>
                                <li>Nivel 2: <strong>${obtenerTiempoFormateado(tiemposPorNivel[1])}</strong></li>
                                <li>Nivel 3: <strong>${obtenerTiempoFormateado(tiemposPorNivel[2])}</strong></li>
                                <li>Nivel 4: <strong>${obtenerTiempoFormateado(tiemposPorNivel[3])}</strong></li>
                            </ul>
                        </div>
                    `;

                    if (victoryTimeMsg) victoryTimeMsg.innerHTML = desgloseFinal;
                    btnSiguienteNivel.textContent = "Volver a Jugar ";
                }

                victoryOverlay.classList.remove('hidden');
            }, 1800);
        }
    }

    function procesarDerrota() {
        juegoPerdido = true;
        detenerCronometro();

        setTimeout(() => {
            victoryTitle.textContent = "¡Tiempo Agotado! ";
            victoryTimeMsg.innerHTML = `Llegaste al límite de <strong>35 segundos</strong> sin armar la imagen.`;
            btnSiguienteNivel.textContent = "Reintentar Nivel 4 ";
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
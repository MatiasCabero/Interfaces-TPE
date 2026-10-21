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
    const angulosPosibles = [0, 90, 180, 270];

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
        let velocidad = 50; /* tiempo de espera entre un salto y el otro */
        const minVueltas = 18 + Math.floor(Math.random() * 8); /* recomendacion de gemini para que caiga una imagen al azar */

        function pasoRuleta() {
            // este es el efecto de la miniatura como que se va seleccionando
            thumbsRuleta.forEach(t => t.classList.remove('active-roulette'));
            if (thumbsRuleta[indiceActual]) {
                thumbsRuleta[indiceActual].classList.add('active-roulette');
            }

            vueltas++;

            if (vueltas < minVueltas) {
                indiceActual = (indiceActual + 1) % thumbsRuleta.length; /* hacemos un bucle circular para que cuando el indice 
                                                                            llegue a 6 (la cantidad de imagenes) vuelva a cero */
                velocidad += 10; /* vamos haciendo que vaya mas lento por cada "vuelta" */
                setTimeout(pasoRuleta, velocidad); /* inicia la siguiente vuelta */
            } else {
                const imagenElegida = bancoDeImagenes[indiceActual];   /* aca se selecciona como imagen en donde haya caido la ruleta */

                setTimeout(() => {
                    mostrarVistaPreviaImagen(imagenElegida);
                }, 400); /* tiempo que tiene el usuario para ver la imagen antes de comenzar el juego */
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

    // aca vamos a calcular que tan grande va a ser el tablero
    // tmb nos sirve para que sea responsive
    function calcularDimensionesTablero() {
        const escala = 0.65; /* solo ocupa el 65%, en el resto van los botones y demas */
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

        /* calcula el centro del tablero */
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

    // --------------------------------------------------------
    // cada pieza es un objeto que tiene diferentes elementos
    // --------------------------------------------------------
    function crearPiezas() {
        piezas = [];
        const anchoPieza = Math.floor(tableroAncho / cantColumnas); /* pueden ser 2,4,6 */
        const altoPieza = Math.floor(tableroAlto / cantFilas); /* siempre va a ser dos */
        const listaFiltros = ['grises', 'brillo', 'negativo'];

        for (let fila = 0; fila < cantFilas; fila++) {
            for (let col = 0; col < cantColumnas; col++) {
                const anguloAleatorio = angulosPosibles[Math.floor(Math.random() * angulosPosibles.length)]; // aca asignamos el angulo que va a tener cada pieza
                const filtroAleatorio = listaFiltros[Math.floor(Math.random() * listaFiltros.length)]; // aca asignamos el filtro aleatorio del nivel 4 a cada pieza

                piezas.push({
                    fila: fila, /* nos dice posicion original */
                    col: col,   /* nos dice posicion original */
                    x: offsetX + (col * anchoPieza),  /* posicion dentro del canvas */
                    y: offsetY + (fila * altoPieza),  /* posicion dentro del canvas */
                    ancho: anchoPieza,
                    alto: altoPieza,
                    angulo: anguloAleatorio,
                    filtroNivel4: filtroAleatorio  /* aca se define que el filtro en el nivel 4 es aleatorio */
                });
            }
        }
    }

    // -------------------------------------------------
    // ACA ESTA COMO SE PROCESA LA IMAGEN CON EL FILTRO
    // -------------------------------------------------
    // Creación y Recorte: Se crea el canvas temporal y se le pega el recorte limpio de la foto original (imagenActual) en posición 0.   
    // Procesamiento de Color: Se le leen los píxeles con getImageData, se ejecuta la función de filtro (grises, brillo, negativo) y se vuelven a volcar los píxeles modificados con putImageData.   
    // Transformación y Dibujo: Se lleva esa "estampa" ya procesada al canvas principal, se traslada el eje al centro de la celda, se aplica la rotación con ctx.rotate y se dibuja finalmente en pantalla. 
    // esta funcion se repite segun la cantidad de piezas quie tenga la imagen, ya que se aplica a cada pieza
    
    function dibujarTablero() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); /* borramos todo lo que habia en el canvas */
                        /* arranca del 0,0 hasta el ancho y alto del canvas */
        ctx.fillStyle = '#D4EBF8'; /* pintamos de celeste */
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const anchoImgPieza = Math.floor(imagenActual.width / cantColumnas);
        const altoImgPieza = Math.floor(imagenActual.height / cantFilas);

        const MARGEN_SOLAPAMIENTO = 1.2;

        piezas.forEach((pieza) => {
            // por cada pieza del arreglo crea un canvas invisible
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = anchoImgPieza;
            tempCanvas.height = altoImgPieza;
            const tempCtx = tempCanvas.getContext('2d');

            tempCtx.drawImage(
                // Recorta únicamente el pedacito de foto que le corresponde a esa ficha desde 
                // la imagen original y la pega en el lienzo temporal
                imagenActual,
                pieza.col * anchoImgPieza, pieza.fila * altoImgPieza,
                anchoImgPieza, altoImgPieza,
                0, 0,
                anchoImgPieza, altoImgPieza
            );

            if (!juegoGanado) {
                try {
                    let imgData = tempCtx.getImageData(0, 0, anchoImgPieza, altoImgPieza); /* extrae los piexeles del lienzo temporal */
                    aplicarFiltroSegunNivel(imgData, pieza); /* aplica el filtro */
                    tempCtx.putImageData(imgData, 0, 0); /* vuelve a pegar los piexeles procesados */
                } catch (e) {
                    console.warn("Usa Live Server para probar los filtros píxel por píxel.", e);
                }
            }

            ctx.save(); /* guarda el estado original del canvas (sin rotar) */

            // Mueve el eje 0,0 del canvas desde la esquina superior izquierda hasta el centro 
            // exacto de la ficha
            const centroX = pieza.x + pieza.ancho / 2;
            const centroY = pieza.y + pieza.alto / 2;
            ctx.translate(centroX, centroY);  
            ctx.rotate((pieza.angulo * Math.PI) / 180); /* romatos la pieza con el angulo guardado */

            // volvemos a dibujar la imagen pero con el nuevo centro
            ctx.drawImage(
                tempCanvas,
                -pieza.ancho / 2 - MARGEN_SOLAPAMIENTO / 2,
                -pieza.alto / 2 - MARGEN_SOLAPAMIENTO / 2,
                pieza.ancho + MARGEN_SOLAPAMIENTO,
                pieza.alto + MARGEN_SOLAPAMIENTO
            );

            ctx.restore(); // Restaura el canvas a la normalidad para la siguiente pieza
        });
    }

    canvas.addEventListener('click', (e) => {
        if (!juegoGanado && !juegoPerdido) procesarClick(e, -90);   /* click izquierdo gira izquierda */
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!juegoGanado && !juegoPerdido) procesarClick(e, 90);    /* click derecho gira derecha */
    });
    


    // -------------------------------------------------
    // ACA ESTA COMO SE PROCESAN LOS CLICKS
    // -------------------------------------------------
    function procesarClick(event, grados) {
        // calculamos posicion real dentro del canvas
        const rect = canvas.getBoundingClientRect(); /* nos da la posicion del <canvas> */
        /* event.clienteX y event.clienteY te da la posicion exacta del puntero respecto a toda la pantalla del navegador */
        const mouseX = event.clientX - rect.left; 
        const mouseY = event.clientY - rect.top; 
        // cuando restamos los margenes del canvas (rect.left y rect.top) obtenemos las coordenadas exactas
        // dentro del lienzo

        piezas.forEach(pieza => {
            // recorremos todas las fichas dela arreglo piezas y verificamos siu las coordenas mouseX y mouseY 
            // caen adentro del rectangulo de alguna pieza
            if (
                mouseX >= pieza.x && mouseX <= pieza.x + pieza.ancho &&
                mouseY >= pieza.y && mouseY <= pieza.y + pieza.alto
            ) {
                // Si es la primera vez que toca una pieza en este nivel, arranca el reloj
                if (!primerClicRealizado) {
                    primerClicRealizado = true;
                    iniciarCronometro();
                }

                pieza.angulo = (pieza.angulo + grados + 360) % 360; /* forma matematica para rotar */
                dibujarTablero(); /* por cada pieza rotada vuelve a dibujar todo el tablero */
                verificarVictoria(); /* chequea que el angulo de todas las piezas este en 0 */
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
            // recordar que el pixel tiene 4 elementos, por eso el for va de 4 en 4
            const gris = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            //canal rojo
            data[i]     = gris;
            //canal verde
            data[i + 1] = gris;
            //canal azul
            data[i + 2] = gris;

            /* data[i+3] seria la transparencia*/
        }
    }

    function aplicarBrillo(imageData, incremento = 60) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // recordar que el pixel tiene 4 elementos, por eso el for va de 4 en 4

            //canal rojo
            data[i]     = Math.min(255, data[i] + incremento);
            //canal verde
            data[i + 1] = Math.min(255, data[i + 1] + incremento);
            //canal azul
            data[i + 2] = Math.min(255, data[i + 2] + incremento);

            /* el Math.min sirve para que no nos pasemos del 255 cuando hacemos el pixel+incremento */

            /* data[i+3] seria la transparencia*/
        }
    }

    function aplicarNegativo(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // recordar que el pixel tiene 4 elementos, por eso el for va de 4 en 4
            
            //canal rojo
            data[i]     = 255 - data[i];
            //canal verde
            data[i + 1] = 255 - data[i + 1];
            //canal azul
            data[i + 2] = 255 - data[i + 2];

            /* data[i+3] seria la transparencia*/
        }
    }

    // aca se aplican los filtros segun el nivel
    function aplicarFiltroSegunNivel(imageData, pieza) {
        if (nivelActual === 1) {
            aplicarEscalaDeGrises(imageData);
        } else if (nivelActual === 2) {
            aplicarBrillo(imageData, 60);
        } else if (nivelActual === 3) {
            aplicarNegativo(imageData);
        } else if (nivelActual === 4) {
            // aca se busca dentro del objeto "pieza" que efecto el toco por azar
            // y segund que le haya tocado es el filtro que se le aplica
            if (pieza.filtroNivel4 === 'grises') aplicarEscalaDeGrises(imageData);
            else if (pieza.filtroNivel4 === 'brillo') aplicarBrillo(imageData, 60);
            else if (pieza.filtroNivel4 === 'negativo') aplicarNegativo(imageData);
        }
    }
});
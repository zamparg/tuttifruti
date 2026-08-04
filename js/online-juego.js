function avisos(aviso, duracion) {
    Toastify({
        text: aviso,
        duration: duracion,
        gravity: 'top',
        position: 'center',
        offset: { y: 200 },
        style: { background: "linear-gradient(to right, #a0bcd6, #d6a0bc)" },
    }).showToast();
}

const codigo = sessionStorage.getItem("codigoSala");
const quienSoy = sessionStorage.getItem("quienSoy");
const nombreJugador = sessionStorage.getItem("nombreJugador");

if (!codigo || !quienSoy) {
    location.href = "../index.html";
}

const espacioLetraRonda = document.getElementById("espacioLetraRonda");
const espacioTimer = document.getElementById("espacioTimer");
const filaEncabezados = document.getElementById("filaEncabezados");
const filaRespuestas = document.getElementById("filaRespuestas");
const espacioJugador1 = document.getElementById("espacioJugador1");
const renglones = document.getElementById("renglones");
const puntajeTotal1 = document.getElementById("puntosJugador1");
const puntajeTotal2 = document.getElementById("puntosJugador2");
const renglonGanador = document.getElementById("renglonGanador");

espacioJugador1.innerHTML = `<p class="jugador1">${nombreJugador}</p>`;

// Estado local para no repetir acciones (reconstruir DOM, disparar cálculos) cada vez que
// el listener de Firebase se dispara de nuevo por cualquier escritura.
let numeroRondaEnPantalla = null;
let avisoTiempoMostrado = false;
let intervaloTimer = null;
let botYaLanzadoParaLetra = null;
let calculoYaDisparadoParaRonda = null;
let autoFinalizadoParaRonda = null;
let resultadoYaEscritoParaRonda = null;

// Debounce corto para no escribir en Firebase en cada tecla individual, sin perder la regla de
// "cualquier tecla resetea el timer a 60": el reseteo del timer ocurre igual en cada evento local
// (ver actualizarTimerLocalPorEscritura), solo el guardado en Firebase se agrupa.
let debounceGuardado = null;

function construirFormulario(categorias) {
    filaEncabezados.innerHTML = `<th>Letra</th>`;
    for (const categoria of categorias) {
        filaEncabezados.innerHTML += `<th>${categoria}</th>`;
    }
    filaEncabezados.innerHTML += `<th>Puntos</th>`;

    filaRespuestas.innerHTML = `<td id="espacioJugador1"><p class="jugador1">${nombreJugador}</p></td>`;
    for (const categoria of categorias) {
        filaRespuestas.innerHTML += `
            <td>
                <div class="celdaRespuesta">
                    <input type="text" class="espacioInput" id="input_${categoria}">
                    <label><input type="checkbox" id="noHay_${categoria}"> No hay posibles</label>
                </div>
            </td>`;
    }
    filaRespuestas.innerHTML += `<td id="celdaBotonFinalizar"><button id="btnFinalizar" class="btn boton1">Finalizar</button></td>`;

    for (const categoria of categorias) {
        const input = document.getElementById(`input_${categoria}`);
        const noHay = document.getElementById(`noHay_${categoria}`);

        input.addEventListener("input", onEscribirRespuesta);

        noHay.addEventListener("change", (e) => {
            if (e.target.checked) {
                input.value = "";
                input.setAttribute("disabled", "disabled");
            } else {
                input.removeAttribute("disabled");
            }
            onEscribirRespuesta();
        });
    }

    document.getElementById("btnFinalizar").onclick = onClickFinalizar;
}

function onEscribirRespuesta() {
    clearTimeout(debounceGuardado);
    debounceGuardado = setTimeout(async () => {
        const snapshot = await refSala(codigo).get();
        const sala = snapshot.val();
        if (!sala || !sala.rondaActual || sala.rondaActual.estado !== "en_curso") return;
        const { valores, noHayPosibles } = leerRespuestasPropias(sala.config.categorias);
        await enviarRespuesta(codigo, quienSoy, valores, noHayPosibles);
    }, 400);
}

function leerRespuestasPropias(categorias) {
    const valores = {};
    const noHayPosibles = {};
    for (const categoria of categorias) {
        const inputEl = document.getElementById(`input_${categoria}`);
        const checkEl = document.getElementById(`noHay_${categoria}`);
        valores[categoria] = inputEl ? inputEl.value.trim().toLowerCase() : "";
        noHayPosibles[categoria] = checkEl ? checkEl.checked : false;
    }
    return { valores, noHayPosibles };
}

function deshabilitarFormulario() {
    for (const input of filaRespuestas.querySelectorAll("input")) {
        input.setAttribute("disabled", "disabled");
    }
    const btn = document.getElementById("btnFinalizar");
    if (btn) btn.setAttribute("disabled", "disabled");
}

async function onClickFinalizar() {
    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    const { valores, noHayPosibles } = leerRespuestasPropias(sala.config.categorias);
    await finalizarTurno(codigo, quienSoy, valores, noHayPosibles);
    deshabilitarFormulario();
}

// TIMER_SEGUNDOS_INACTIVIDAD ya está definida en sala.js (cargado antes que este script).
// El timer no es una cuenta regresiva fija: mide inactividad desde la última tecla presionada por
// CUALQUIERA de los dos jugadores (ultimaActividadTimestamp, compartido por Firebase). Mientras
// alguien escribe ese timestamp se actualiza (ver enviarRespuesta en sala.js) y el timer vuelve a 60.
let ultimaActividadConocida = null;

function actualizarTimer(ultimaActividadTimestamp) {
    ultimaActividadConocida = ultimaActividadTimestamp;
    clearInterval(intervaloTimer);
    intervaloTimer = setInterval(async () => {
        const base = ultimaActividadConocida || Date.now();
        const transcurridoSeg = (Date.now() - base) / 1000;
        const restanteSeg = Math.max(0, Math.ceil(TIMER_SEGUNDOS_INACTIVIDAD - transcurridoSeg));
        espacioTimer.textContent = `${restanteSeg}s`;
        if (restanteSeg <= 0) {
            clearInterval(intervaloTimer);
            if (!avisoTiempoMostrado) {
                avisoTiempoMostrado = true;
                avisos("¡Nadie escribió a tiempo!", 3000);
            }

            // Auto-envío de lo que tenga tipeado si todavía no finalicé, una sola vez.
            const snapshot = await refSala(codigo).get();
            const sala = snapshot.val();
            if (sala && sala.rondaActual && numeroRondaEnPantalla === sala.rondaActual.numero
                && autoFinalizadoParaRonda !== sala.rondaActual.numero) {
                const miRespuesta = sala.rondaActual.respuestas[quienSoy];
                if (miRespuesta && !miRespuesta.finalizado) {
                    autoFinalizadoParaRonda = sala.rondaActual.numero;
                    const { valores, noHayPosibles } = leerRespuestasPropias(sala.config.categorias);
                    await finalizarTurno(codigo, quienSoy, valores, noHayPosibles);
                    deshabilitarFormulario();
                }
            }
        }
    }, 250);
}

function celdaConPuntaje(valor, puntos, categoria, indiceHistorial, quienEsElDeLaCelda, disputa) {
    const puntosTexto = puntos !== undefined ? `<span class="puntitoCelda">${puntos}</span>` : "";
    // Solo se puede disputar la palabra del RIVAL, nunca la propia (no tiene sentido discutirse a uno mismo).
    const esPalabraRival = quienEsElDeLaCelda !== quienSoy;
    const puedeDisputar = valor && !disputa && esPalabraRival;
    const botonDisputar = puedeDisputar
        ? `<button type="button" class="btnDisputar" data-cat="${categoria}" data-indice="${indiceHistorial}" data-contra="${quienEsElDeLaCelda}">discutir</button>`
        : "";
    // La marca de "en disputa" se replica en ambas celdas (propia y rival) para que los dos vean el estado.
    const marcaDisputa = disputa ? `<span class="marcaDisputa" data-cat="${categoria}" data-indice="${indiceHistorial}">⚠ en disputa</span>` : "";
    return `<td>${valor || ""} ${puntosTexto}${botonDisputar}${marcaDisputa}</td>`;
}

function escribirFilaHistorial(entrada, indiceHistorial, jugador1Nombre, jugador2Nombre, categorias) {
    const detalle = entrada.detallePorCategoria || {};
    const disputas = entrada.disputas || {};

    const celdasP1 = categorias.map(c => celdaConPuntaje(
        entrada.jugadaJugador1 && entrada.jugadaJugador1[c], detalle[c] && detalle[c].p1,
        c, indiceHistorial, "p1", disputas[c]
    )).join("");

    const celdasP2 = categorias.map(c => celdaConPuntaje(
        entrada.jugadaJugador2 && entrada.jugadaJugador2[c], detalle[c] && detalle[c].p2,
        c, indiceHistorial, "p2", disputas[c]
    )).join("");

    const filaId = `historial-${indiceHistorial}`;
    let filaExistente = document.getElementById(filaId);

    const html = `
        <table class="tablaJuego tablaHistorial" id="${filaId}">
            <tbody>
                <tr>
                    <td rowspan="2"><p>${entrada.letra.toUpperCase()}</p></td>
                    <td><p class="jugador1">${jugador1Nombre}</p></td>
                    ${celdasP1}
                    <td class="jugador1">${entrada.puntosJugador1}</td>
                </tr>
                <tr>
                    <td><p class="jugador2">${jugador2Nombre}</p></td>
                    ${celdasP2}
                    <td class="jugador2">${entrada.puntosJugador2}</td>
                </tr>
            </tbody>
        </table>`;

    if (filaExistente) {
        filaExistente.outerHTML = html;
    } else {
        renglones.innerHTML += html;
    }

    for (const boton of renglones.querySelectorAll(`#${filaId} .btnDisputar`)) {
        boton.onclick = () => abrirModalDisputa(boton.dataset.indice, boton.dataset.cat, boton.dataset.contra);
    }
    for (const marca of renglones.querySelectorAll(`#${filaId} .marcaDisputa`)) {
        marca.onclick = () => abrirModalDisputa(marca.dataset.indice, marca.dataset.cat, null);
    }
}

// --- DISPUTAS ---

let modalDisputaEl = null;

function cerrarModalDisputa() {
    if (modalDisputaEl) {
        modalDisputaEl.remove();
        modalDisputaEl = null;
    }
}

async function abrirModalDisputa(indiceHistorial, categoria, contraQuienInicial) {
    cerrarModalDisputa();

    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    const entrada = sala.historial[indiceHistorial];
    const disputa = entrada.disputas && entrada.disputas[categoria];

    modalDisputaEl = document.createElement("div");
    modalDisputaEl.className = "modalDisputa";

    if (!disputa) {
        modalDisputaEl.innerHTML = `
            <div class="modalDisputaContenido">
                <h3>Disputar "${categoria}"</h3>
                <p>Palabra en cuestión: <b>${entrada[contraQuienInicial === "p1" ? "jugadaJugador1" : "jugadaJugador2"][categoria]}</b></p>
                <textarea id="causaDisputa" placeholder="¿Por qué la disputás?"></textarea>
                <div class="modalDisputaBotones">
                    <button id="btnEnviarDisputa" class="btn boton1">Enviar</button>
                    <button id="btnCerrarDisputa" class="btn boton3">Cancelar</button>
                </div>
            </div>`;
        document.body.appendChild(modalDisputaEl);
        document.getElementById("btnCerrarDisputa").onclick = cerrarModalDisputa;
        document.getElementById("btnEnviarDisputa").onclick = async () => {
            const causa = document.getElementById("causaDisputa").value.trim();
            if (!causa) return;
            await abrirDisputa(codigo, indiceHistorial, categoria, quienSoy, contraQuienInicial, causa);
            cerrarModalDisputa();
        };
        return;
    }

    const esMiTurno = disputa.turno === quienSoy;
    const historialArgumentos = disputa.argumentos.map(a => `<p><b>${a.autor === quienSoy ? "Vos" : "Rival"}:</b> ${a.tipo === "aceptar" ? "Aceptó" : a.texto}</p>`).join("");

    modalDisputaEl.innerHTML = `
        <div class="modalDisputaContenido">
            <h3>Disputa: "${categoria}"</h3>
            <div class="historialArgumentos">${historialArgumentos}</div>
            ${disputa.estado === "resuelta"
                ? `<p><i>Disputa resuelta.</i></p><div class="modalDisputaBotones"><button id="btnCerrarDisputa" class="btn boton3">Cerrar</button></div>`
                : esMiTurno
                    ? `<textarea id="causaDisputa" placeholder="Tu argumento si rechazás..."></textarea>
                       <div class="modalDisputaBotones">
                           <button id="btnAceptarDisputa" class="btn boton2">Aceptar (mi palabra no vale)</button>
                           <button id="btnRechazarDisputa" class="btn boton1">Rechazar y argumentar</button>
                           <button id="btnCerrarDisputa" class="btn boton3">Cerrar</button>
                       </div>`
                    : `<p><i>Esperando respuesta del rival...</i></p><div class="modalDisputaBotones"><button id="btnCerrarDisputa" class="btn boton3">Cerrar</button></div>`
            }
        </div>`;

    document.body.appendChild(modalDisputaEl);
    document.getElementById("btnCerrarDisputa").onclick = cerrarModalDisputa;

    const btnAceptar = document.getElementById("btnAceptarDisputa");
    const btnRechazar = document.getElementById("btnRechazarDisputa");
    if (btnAceptar) {
        btnAceptar.onclick = async () => {
            await responderDisputa(codigo, indiceHistorial, categoria, quienSoy, "aceptar", "");
            cerrarModalDisputa();
        };
    }
    if (btnRechazar) {
        btnRechazar.onclick = async () => {
            const texto = document.getElementById("causaDisputa").value.trim();
            if (!texto) return;
            await responderDisputa(codigo, indiceHistorial, categoria, quienSoy, "rechazar", texto);
            cerrarModalDisputa();
        };
    }
}

// --- CONTINUAR ---

function mostrarBotonContinuar(sala, ronda) {
    let contenedor = document.getElementById("contenedorContinuar");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "contenedorContinuar";
        contenedor.className = "renglon container-fluid row text-center";
        contenedor.innerHTML = `
            <div class="col-1 margenIzquierdo"></div>
            <div class="col">
                <button id="btnContinuar" class="btn boton1">Continuar</button>
            </div>
            <div class="col" id="estadoContinuar"></div>`;
        document.getElementById("cuaderno").appendChild(contenedor);
        document.getElementById("btnContinuar").onclick = async () => {
            document.getElementById("btnContinuar").setAttribute("disabled", "disabled");
            await confirmarContinuar(codigo, quienSoy);
        };
    }

    const entrada = sala.historial && sala.historial[ronda.numero - 1];
    const hayDisputas = hayDisputasAbiertas(entrada);
    const btnContinuar = document.getElementById("btnContinuar");
    const estadoContinuar = document.getElementById("estadoContinuar");

    if (hayDisputas) {
        btnContinuar.setAttribute("disabled", "disabled");
        estadoContinuar.textContent = "Hay una disputa sin resolver.";
    } else if (ronda.confirmadoContinuar[quienSoy]) {
        btnContinuar.setAttribute("disabled", "disabled");
        estadoContinuar.textContent = "Esperando al rival...";
    } else {
        btnContinuar.removeAttribute("disabled");
        estadoContinuar.textContent = "";
    }
}

function quitarBotonContinuar() {
    const contenedor = document.getElementById("contenedorContinuar");
    if (contenedor) contenedor.remove();
}

function mostrarFinDePartida(sala) {
    clearInterval(intervaloTimer);
    quitarBotonContinuar();

    const puntos1 = sala.jugadores.p1.puntosTotales || 0;
    const puntos2 = sala.jugadores.p2.puntosTotales || 0;
    const nombre1 = sala.jugadores.p1.nombre;
    const nombre2 = sala.jugadores.p2.nombre;
    const cantJugadas = sala.historial ? Object.keys(sala.historial).length : 0;

    puntajeTotal1.innerHTML = `<p class="jugador1">${nombre1}: ${puntos1} puntos.</p>`;
    puntajeTotal2.innerHTML = `<p class="jugador2">${nombre2}: ${puntos2} puntos.</p>`;

    if (puntos1 > puntos2) {
        renglonGanador.innerHTML = `<h3 class="jugador1">¡El ganador de toda la partida es ${nombre1}! ¡Con ${puntos1} puntos!</h3>`;
        if (quienSoy === "p1") guardarEnRanking(nombre1, puntos1, cantJugadas);
    } else if (puntos2 > puntos1) {
        renglonGanador.innerHTML = `<h3 class="jugador2">¡El ganador de toda la partida es ${nombre2}! ¡Con ${puntos2} puntos!</h3>`;
        if (quienSoy === "p2") guardarEnRanking(nombre2, puntos2, cantJugadas);
    } else {
        renglonGanador.innerHTML = `<h3>¡Este juego ha resultado en un empate! ¡Con ${puntos1} puntos cada uno!</h3>`;
    }

    renglonGanador.innerHTML += `
        <div class="row">
            <div class="col">
                <a href="../index.html"><button class="boton2" id="btnReset">Volver a Jugar</button></a>
            </div>
        </div>`;

    // Se oculta solo la tabla de la última ronda en curso (ya no aplica), pero se deja visible
    // el historial completo en #renglones para que se sigan viendo todas las categorías jugadas.
    const tabla = document.querySelector("#cuaderno .tablaJuego");
    if (tabla) tabla.style.display = "none";
}

escucharSala(codigo, async (sala) => {
    if (!sala) return;

    if (sala.estado === "finalizado") {
        mostrarFinDePartida(sala);
        return;
    }

    if (sala.estado !== "jugando" || !sala.rondaActual) return;

    const ronda = sala.rondaActual;

    // --- Ronda todavía no revelada: mostrar espera de "Continuar" sin letra ni formulario ---
    if (!ronda.revelada) {
        numeroRondaEnPantalla = null; // fuerza reconstrucción cuando se revele
        espacioLetraRonda.textContent = "?";
        espacioTimer.textContent = "";
        filaEncabezados.innerHTML = "";
        filaRespuestas.innerHTML = "";
        mostrarBotonContinuar(sala, ronda);
        return;
    }

    // --- Nueva ronda revelada: reconstruir el formulario una sola vez ---
    if (ronda.numero !== numeroRondaEnPantalla) {
        numeroRondaEnPantalla = ronda.numero;
        avisoTiempoMostrado = false;
        botYaLanzadoParaLetra = null;
        calculoYaDisparadoParaRonda = null;
        autoFinalizadoParaRonda = null;

        quitarBotonContinuar();

        espacioLetraRonda.textContent = ronda.letra.toUpperCase();
        avisos(`¡Vamos a jugar con la letra "${ronda.letra.toUpperCase()}"!`, 3000);

        construirFormulario(sala.config.categorias);
        actualizarTimer(ronda.ultimaActividadTimestamp);
    } else {
        // Misma ronda: el rival puede haber escrito y reseteado el timer sin que yo reconstruya nada.
        ultimaActividadConocida = ronda.ultimaActividadTimestamp;
    }

    // Si mi turno ya está finalizado, o si el turno debe cerrarse por completo, deshabilito mi formulario.
    const miTurnoFinalizado = ronda.respuestas[quienSoy] && ronda.respuestas[quienSoy].finalizado;
    if ((miTurnoFinalizado || turnoDebeCerrarse(ronda)) && ronda.estado !== "cerrada") {
        deshabilitarFormulario();
    }

    // Modo bot: el creador simula al jugador 2 localmente, una sola vez por letra.
    // TIMER_SEGUNDOS_INACTIVIDAD (60) como escala de referencia para los delays del bot.
    if (sala.modo === "bot" && quienSoy === "p1" && botYaLanzadoParaLetra !== ronda.letra) {
        botYaLanzadoParaLetra = ronda.letra;
        simularJugadaBot(codigo, ronda.letra, sala.config.categorias, sala.nivelBot, TIMER_SEGUNDOS_INACTIVIDAD);
    }

    // Solo el creador dispara el cálculo de puntos, una sola vez por ronda.
    if (quienSoy === "p1" && ronda.estado === "en_curso" && turnoDebeCerrarse(ronda) && calculoYaDisparadoParaRonda !== ronda.numero) {
        calculoYaDisparadoParaRonda = ronda.numero;
        await calcularYCerrarRonda(codigo);
    }

    // --- Ronda cerrada: mostrar/actualizar resultado y ofrecer Continuar (nunca avanza sola) ---
    if (ronda.estado === "cerrada") {
        clearInterval(intervaloTimer);
        deshabilitarFormulario();

        const indiceHistorial = ronda.numero - 1;
        const entrada = sala.historial && sala.historial[indiceHistorial];

        if (entrada) {
            escribirFilaHistorial(entrada, indiceHistorial, sala.jugadores.p1.nombre, sala.jugadores.p2.nombre, sala.config.categorias);
            puntajeTotal1.innerHTML = `<p class="jugador1">${sala.jugadores.p1.nombre}: ${sala.jugadores.p1.puntosTotales} puntos.</p>`;
            puntajeTotal2.innerHTML = `<p class="jugador2">${sala.jugadores.p2.nombre}: ${sala.jugadores.p2.puntosTotales} puntos.</p>`;

            if (resultadoYaEscritoParaRonda !== ronda.numero) {
                resultadoYaEscritoParaRonda = ronda.numero;
                if (entrada.puntosJugador1 > entrada.puntosJugador2) {
                    avisos(`¡Ganó la ronda ${sala.jugadores.p1.nombre}!`, 3000);
                } else if (entrada.puntosJugador2 > entrada.puntosJugador1) {
                    avisos(`¡Ganó la ronda ${sala.jugadores.p2.nombre}!`, 3000);
                } else {
                    avisos("¡Empate en la ronda!", 3000);
                }
            }
        }

        mostrarBotonContinuar(sala, ronda);

        // Si ambos ya confirmaron continuar y no hay disputas abiertas, avanza a la ronda siguiente.
        const entradaActual = sala.historial && sala.historial[indiceHistorial];
        const ambosConfirmaron = ronda.confirmadoContinuar && ronda.confirmadoContinuar.p1 && ronda.confirmadoContinuar.p2;
        if (ambosConfirmaron && !hayDisputasAbiertas(entradaActual) && quienSoy === "p1") {
            await avanzarSiguienteRonda(codigo);
        }
    }
});

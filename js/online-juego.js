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
const rival = quienSoy === "p1" ? "p2" : "p1";

if (!codigo || !quienSoy) {
    location.href = "../index.html";
}

const espacioLetraRonda = document.getElementById("espacioLetraRonda");
const espacioTimer = document.getElementById("espacioTimer");
const renglonCategorias = document.getElementById("renglonCategorias");
const filaJugador1 = document.getElementById("filaJugador1");
const espacioJugador1 = document.getElementById("espacioJugador1");
const btnFinalizar = document.getElementById("btnFinalizar");
const renglones = document.getElementById("renglones");
const puntajeTotal1 = document.getElementById("puntosJugador1");
const puntajeTotal2 = document.getElementById("puntosJugador2");
const renglonGanador = document.getElementById("renglonGanador");
const margenInferior = document.getElementById("margenInferior");

espacioJugador1.innerHTML = `<p class="jugador1">${nombreJugador}</p>`;

let numeroRondaRenderizada = null;
let intervaloTimer = null;
let botAlEjecutarLetra = null; // evita relanzar el bot para la misma ronda
let ronditaCerrandoYaDisparada = null;

function construirFormulario(categorias) {
    renglonCategorias.innerHTML = `<div class="col-1 margenIzquierdo"></div>`;
    for (const categoria of categorias) {
        renglonCategorias.innerHTML += `<div class="col lineaDivisoria"><h2>${categoria}</h2></div>`;
    }
    renglonCategorias.innerHTML += `<div class="col"><h2>Puntos</h2></div>`;

    filaJugador1.innerHTML = `<div class="col-1 margenIzquierdo" id="espacioJugador1"><p class="jugador1">${nombreJugador}</p></div>`;
    for (const categoria of categorias) {
        filaJugador1.innerHTML += `
            <div class="col lineaDivisoria espacio">
                <input type="text" class="espacioInput" id="input_${categoria}">
                <label>
                    <input type="checkbox" id="noHay_${categoria}"> No hay posibles
                </label>
            </div>`;
    }
    filaJugador1.innerHTML += `<div class="col"></div>`;

    for (const categoria of categorias) {
        document.getElementById(`noHay_${categoria}`).addEventListener("change", (e) => {
            const input = document.getElementById(`input_${categoria}`);
            if (e.target.checked) {
                input.value = "";
                input.setAttribute("disabled", "disabled");
            } else {
                input.removeAttribute("disabled");
            }
        });
    }
}

function leerRespuestasPropias(categorias) {
    const valores = {};
    const noHayPosibles = {};
    for (const categoria of categorias) {
        valores[categoria] = document.getElementById(`input_${categoria}`).value.trim().toLowerCase();
        noHayPosibles[categoria] = document.getElementById(`noHay_${categoria}`).checked;
    }
    return { valores, noHayPosibles };
}

function deshabilitarFormulario() {
    for (const input of filaJugador1.querySelectorAll("input")) {
        input.setAttribute("disabled", "disabled");
    }
    btnFinalizar.setAttribute("disabled", "disabled");
}

btnFinalizar.onclick = async () => {
    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    const { valores, noHayPosibles } = leerRespuestasPropias(sala.config.categorias);
    await finalizarTurno(codigo, quienSoy, valores, noHayPosibles);
    deshabilitarFormulario();
};

function actualizarTimer(finLimiteTimestamp) {
    clearInterval(intervaloTimer);
    intervaloTimer = setInterval(() => {
        const restanteMs = finLimiteTimestamp - Date.now();
        const restanteSeg = Math.max(0, Math.ceil(restanteMs / 1000));
        espacioTimer.textContent = `${restanteSeg}s`;
        if (restanteSeg <= 0) clearInterval(intervaloTimer);
    }, 250);
}

function escribirFilaHistorial(entrada, jugador1Nombre, jugador2Nombre, categorias) {
    const celdasJugador = (jugada) => categorias.map(c => `<div class="col lineaDivisoria"><p>${jugada[c] || ""}</p></div>`).join("");

    renglones.innerHTML += `
        <div class="renglon container-fluid row text-center">
            <div class="col-1 margenIzquierdo"><p class="jugador1">${jugador1Nombre}:</p></div>
            <div class="col lineaDivisoria"><p>${entrada.letra.toUpperCase()}</p></div>
            ${celdasJugador(entrada.jugadaJugador1)}
            <div class="col jugador1"><p>${entrada.puntosJugador1}</p></div>
        </div>
        <div class="renglon container-fluid row text-center">
            <div class="col-1 margenIzquierdo"><p class="jugador2">${jugador2Nombre}:</p></div>
            <div class="col lineaDivisoria"><p>${entrada.letra.toUpperCase()}</p></div>
            ${celdasJugador(entrada.jugadaJugador2)}
            <div class="col jugador2"><p>${entrada.puntosJugador2}</p></div>
        </div>`;
}

function mostrarFinDePartida(sala) {
    clearInterval(intervaloTimer);

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

    btnFinalizar.style.display = "none";
}

escucharSala(codigo, async (sala) => {
    if (!sala) return;

    if (sala.estado === "finalizado") {
        mostrarFinDePartida(sala);
        return;
    }

    if (sala.estado !== "jugando" || !sala.rondaActual) return;

    const ronda = sala.rondaActual;

    // Nueva ronda: reconstruir el formulario y arrancar el bot si corresponde.
    if (ronda.numero !== numeroRondaRenderizada) {
        numeroRondaRenderizada = ronda.numero;
        ronditaCerrandoYaDisparada = null;
        botAlEjecutarLetra = null;

        espacioLetraRonda.textContent = ronda.letra.toUpperCase();
        avisos(`¡Vamos a jugar con la letra "${ronda.letra.toUpperCase()}"!`, 3000);

        construirFormulario(sala.config.categorias);
        btnFinalizar.style.display = "";
        btnFinalizar.removeAttribute("disabled");

        actualizarTimer(ronda.finLimiteTimestamp);
    }

    // Si el rival ya marcó su turno como cerrado antes que yo (perfecto sin no-hay-posibles), me deshabilita.
    if (ronda.respuestas[quienSoy] && ronda.respuestas[quienSoy].finalizado) {
        deshabilitarFormulario();
    }

    // Modo bot: el creador simula al jugador 2 localmente.
    if (sala.modo === "bot" && quienSoy === "p1" && botAlEjecutarLetra !== ronda.letra) {
        botAlEjecutarLetra = ronda.letra;
        simularJugadaBot(codigo, ronda.letra, sala.config.categorias, sala.nivelBot, sala.config.timer);
    }

    // Auto-envío al vencer el timer si todavía no finalicé.
    const yaVencioTimer = Date.now() >= ronda.finLimiteTimestamp;
    if (yaVencioTimer && ronda.respuestas[quienSoy] && !ronda.respuestas[quienSoy].finalizado) {
        const { valores, noHayPosibles } = leerRespuestasPropias(sala.config.categorias);
        await finalizarTurno(codigo, quienSoy, valores, noHayPosibles);
        deshabilitarFormulario();
    }

    // Solo el creador dispara el cálculo de puntos, una sola vez por ronda.
    if (quienSoy === "p1" && ronda.estado === "en_curso" && turnoDebeCerrarse(ronda) && ronditaCerrandoYaDisparada !== ronda.numero) {
        ronditaCerrandoYaDisparada = ronda.numero;
        await calcularYCerrarRonda(codigo, sala);
    }

    if (ronda.estado === "cerrada") {
        clearInterval(intervaloTimer);

        const indiceHistorial = ronda.numero - 1;
        const entrada = sala.historial && sala.historial[indiceHistorial];

        if (entrada && numeroRondaRenderizada === ronda.numero) {
            numeroRondaRenderizada = null; // evita re-escribir la fila si vuelve a disparar el listener
            escribirFilaHistorial(entrada, sala.jugadores.p1.nombre, sala.jugadores.p2.nombre, sala.config.categorias);
            puntajeTotal1.innerHTML = `<p class="jugador1">${sala.jugadores.p1.nombre}: ${sala.jugadores.p1.puntosTotales} puntos.</p>`;
            puntajeTotal2.innerHTML = `<p class="jugador2">${sala.jugadores.p2.nombre}: ${sala.jugadores.p2.puntosTotales} puntos.</p>`;

            if (quienSoy === "p1") {
                setTimeout(() => avanzarSiguienteRonda(codigo), 3000);
            }
        }
    }
});

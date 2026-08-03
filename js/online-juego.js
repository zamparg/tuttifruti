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
const btnFinalizar = document.getElementById("btnFinalizar");
const renglones = document.getElementById("renglones");
const puntajeTotal1 = document.getElementById("puntosJugador1");
const puntajeTotal2 = document.getElementById("puntosJugador2");
const renglonGanador = document.getElementById("renglonGanador");

espacioJugador1.innerHTML = `<p class="jugador1">${nombreJugador}</p>`;

// Estado local de "qué ronda ya rendericé", para no reconstruir el formulario ni repetir
// avisos cada vez que el listener de Firebase se dispara de nuevo por cualquier escritura.
let numeroRondaEnPantalla = null;
let avisoTiempoMostrado = false;
let intervaloTimer = null;
let botYaLanzadoParaLetra = null;
let calculoYaDisparadoParaRonda = null;
let resultadoYaEscritoParaRonda = null;
let siguienteRondaYaProgramada = null;

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
    filaRespuestas.innerHTML += `<td></td>`;

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
    for (const input of filaRespuestas.querySelectorAll("input")) {
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
        if (restanteSeg <= 0) {
            clearInterval(intervaloTimer);
            if (!avisoTiempoMostrado) {
                avisoTiempoMostrado = true;
                avisos("¡Se acabó el tiempo!", 3000);
            }
        }
    }, 250);
}

function escribirFilaHistorial(entrada, jugador1Nombre, jugador2Nombre, categorias) {
    const celdasJugador = (jugada) => categorias.map(c => `<td>${jugada[c] || ""}</td>`).join("");

    renglones.innerHTML += `
        <table class="tablaJuego">
            <tbody>
                <tr>
                    <td><p class="jugador1">${jugador1Nombre}</p></td>
                    <td>${entrada.letra.toUpperCase()}</td>
                    ${celdasJugador(entrada.jugadaJugador1)}
                    <td class="jugador1">${entrada.puntosJugador1}</td>
                </tr>
                <tr>
                    <td><p class="jugador2">${jugador2Nombre}</p></td>
                    <td>${entrada.letra.toUpperCase()}</td>
                    ${celdasJugador(entrada.jugadaJugador2)}
                    <td class="jugador2">${entrada.puntosJugador2}</td>
                </tr>
            </tbody>
        </table>`;
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

    // --- Nueva ronda: reconstruir el formulario una sola vez ---
    if (ronda.numero !== numeroRondaEnPantalla) {
        numeroRondaEnPantalla = ronda.numero;
        avisoTiempoMostrado = false;
        botYaLanzadoParaLetra = null;
        calculoYaDisparadoParaRonda = null;

        espacioLetraRonda.textContent = ronda.letra.toUpperCase();
        avisos(`¡Vamos a jugar con la letra "${ronda.letra.toUpperCase()}"!`, 3000);

        construirFormulario(sala.config.categorias);
        btnFinalizar.style.display = "";
        btnFinalizar.removeAttribute("disabled");

        actualizarTimer(ronda.finLimiteTimestamp);
    }

    // Si mi turno ya está finalizado, o si el turno debe cerrarse por completo, deshabilito mi formulario.
    const miTurnoFinalizado = ronda.respuestas[quienSoy] && ronda.respuestas[quienSoy].finalizado;
    if ((miTurnoFinalizado || turnoDebeCerrarse(ronda)) && ronda.estado !== "cerrada") {
        deshabilitarFormulario();
    }

    // Modo bot: el creador simula al jugador 2 localmente, una sola vez por letra.
    if (sala.modo === "bot" && quienSoy === "p1" && botYaLanzadoParaLetra !== ronda.letra) {
        botYaLanzadoParaLetra = ronda.letra;
        simularJugadaBot(codigo, ronda.letra, sala.config.categorias, sala.nivelBot, sala.config.timer);
    }

    // Solo el creador dispara el cálculo de puntos, una sola vez por ronda.
    if (quienSoy === "p1" && ronda.estado === "en_curso" && turnoDebeCerrarse(ronda) && calculoYaDisparadoParaRonda !== ronda.numero) {
        calculoYaDisparadoParaRonda = ronda.numero;
        await calcularYCerrarRonda(codigo, sala);
    }

    // --- Ronda cerrada: mostrar resultado y programar el avance, una sola vez por ronda ---
    if (ronda.estado === "cerrada" && resultadoYaEscritoParaRonda !== ronda.numero) {
        resultadoYaEscritoParaRonda = ronda.numero;
        clearInterval(intervaloTimer);
        deshabilitarFormulario();

        const indiceHistorial = ronda.numero - 1;
        const entrada = sala.historial && sala.historial[indiceHistorial];

        if (entrada) {
            escribirFilaHistorial(entrada, sala.jugadores.p1.nombre, sala.jugadores.p2.nombre, sala.config.categorias);
            puntajeTotal1.innerHTML = `<p class="jugador1">${sala.jugadores.p1.nombre}: ${sala.jugadores.p1.puntosTotales} puntos.</p>`;
            puntajeTotal2.innerHTML = `<p class="jugador2">${sala.jugadores.p2.nombre}: ${sala.jugadores.p2.puntosTotales} puntos.</p>`;

            if (entrada.puntosJugador1 > entrada.puntosJugador2) {
                avisos(`¡Ganó la ronda ${sala.jugadores.p1.nombre}!`, 3000);
            } else if (entrada.puntosJugador2 > entrada.puntosJugador1) {
                avisos(`¡Ganó la ronda ${sala.jugadores.p2.nombre}!`, 3000);
            } else {
                avisos("¡Empate en la ronda!", 3000);
            }
        }

        if (quienSoy === "p1" && siguienteRondaYaProgramada !== ronda.numero) {
            siguienteRondaYaProgramada = ronda.numero;
            setTimeout(() => avanzarSiguienteRonda(codigo), 3000);
        }
    }
});

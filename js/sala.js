// Helpers de acceso a la sala en Firebase Realtime Database.
// Depende de: db (js/firebase-config.js), CATEGORIAS/LETRAS/elegirLetraRonda/calcularPuntosRonda (js/puntaje.js),
// Jugada/JugadorRankin (js/clases.js).

const CODIGO_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos (0/O, 1/I)

function generarCodigoSala() {
    let codigo = "";
    for (let i = 0; i < 6; i++) {
        codigo += CODIGO_CHARS[Math.floor(Math.random() * CODIGO_CHARS.length)];
    }
    return codigo;
}

function refSala(codigo) {
    return db.ref(`salas/${codigo}`);
}

async function crearSala(nombreJugador1, modo) {
    const codigo = generarCodigoSala();
    const sala = {
        creador: "p1",
        estado: "configurando",
        modo: modo, // "online" | "bot"
        nivelBot: null,
        jugadores: {
            p1: { nombre: nombreJugador1, conectado: true, puntosTotales: 0 }
        },
        config: {
            categorias: CATEGORIAS,
            poolLetras: LETRAS.split(""),
            timer: 60,
            confirmadoPor: { p1: false, p2: false }
        }
    };
    await refSala(codigo).set(sala);
    return codigo;
}

async function unirseSala(codigo, nombreJugador2) {
    const snapshot = await refSala(codigo).get();
    if (!snapshot.exists()) {
        throw new Error("No existe una sala con ese código.");
    }
    const sala = snapshot.val();
    if (sala.estado !== "configurando" && sala.estado !== "lobby") {
        throw new Error("Esa sala ya está jugando o finalizó.");
    }
    await refSala(codigo).child("jugadores/p2").set({
        nombre: nombreJugador2,
        conectado: true,
        puntosTotales: 0
    });
    return sala;
}

function escucharSala(codigo, callback) {
    const ref = refSala(codigo);
    ref.on("value", snapshot => callback(snapshot.val()));
    return () => ref.off("value");
}

async function actualizarConfig(codigo, config) {
    await refSala(codigo).child("config").update(config);
}

async function confirmarConfig(codigo, quienSoy) {
    await refSala(codigo).child(`config/confirmadoPor/${quienSoy}`).set(true);

    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    if (sala.config.confirmadoPor.p1 && sala.config.confirmadoPor.p2) {
        await iniciarSiguienteRonda(codigo, sala);
    }
}

async function iniciarSiguienteRonda(codigo, sala) {
    const letrasUsadas = sala.historial ? Object.values(sala.historial).map(h => h.letra) : [];
    const letra = elegirLetraRonda(sala.config.poolLetras, letrasUsadas);

    if (letra === null) {
        await finalizarPartida(codigo);
        return;
    }

    const ahora = Date.now();
    const rondaActual = {
        numero: letrasUsadas.length + 1,
        letra,
        inicioTimestamp: ahora,
        finLimiteTimestamp: ahora + sala.config.timer * 1000,
        estado: "en_curso",
        respuestas: {
            p1: { valores: {}, noHayPosibles: {}, finalizado: false, finalizadoEn: null },
            p2: { valores: {}, noHayPosibles: {}, finalizado: false, finalizadoEn: null }
        }
    };

    await refSala(codigo).update({
        estado: "jugando",
        rondaActual
    });
}

async function enviarRespuesta(codigo, quienSoy, valores, noHayPosibles) {
    await refSala(codigo).child(`rondaActual/respuestas/${quienSoy}`).update({
        valores,
        noHayPosibles
    });
}

async function finalizarTurno(codigo, quienSoy, valores, noHayPosibles) {
    await refSala(codigo).child(`rondaActual/respuestas/${quienSoy}`).update({
        valores,
        noHayPosibles,
        finalizado: true,
        finalizadoEn: Date.now()
    });
}

// Un jugador finalizado sin ningún "no hay posibles" cierra el turno para ambos de inmediato.
// Un jugador finalizado con al menos un "no hay posibles" deja el turno abierto para el rival.
function turnoDebeCerrarse(rondaActual) {
    const { p1, p2 } = rondaActual.respuestas;
    const ventencioTimer = Date.now() >= rondaActual.finLimiteTimestamp;

    if (ventencioTimer) return true;
    if (p1.finalizado && p2.finalizado) return true;

    const tieneNoHayPosibles = (jugador) => Object.values(jugador.noHayPosibles || {}).some(v => v);

    if (p1.finalizado && !tieneNoHayPosibles(p1)) return true;
    if (p2.finalizado && !tieneNoHayPosibles(p2)) return true;

    return false;
}

// Solo la llama el cliente creador (p1), protegido con una transacción sobre rondaActual/estado.
async function calcularYCerrarRonda(codigo, sala) {
    const rondaRef = refSala(codigo).child("rondaActual");

    const resultadoTransaccion = await rondaRef.child("estado").transaction(estadoActual => {
        if (estadoActual !== "en_curso") return; // ya se está calculando o ya cerró, abortar
        return "calculando";
    });

    if (!resultadoTransaccion.committed) return;

    const rondaActual = sala.rondaActual;
    const { letra, respuestas } = rondaActual;
    const categorias = sala.config.categorias;

    const jugada1 = respuestas.p1.valores || {};
    const jugada2 = respuestas.p2.valores || {};

    const { puntosP1, puntosP2 } = calcularPuntosRonda(
        jugada1, jugada2, letra, categorias,
        respuestas.p1.noHayPosibles, respuestas.p2.noHayPosibles
    );

    const puntosTotalesP1 = (sala.jugadores.p1.puntosTotales || 0) + puntosP1;
    const puntosTotalesP2 = (sala.jugadores.p2.puntosTotales || 0) + puntosP2;

    const entradaHistorial = new Jugada(letra, jugada1, puntosP1, puntosTotalesP1, jugada2, puntosP2, puntosTotalesP2);

    const numeroRonda = rondaActual.numero;

    await refSala(codigo).update({
        [`historial/${numeroRonda - 1}`]: entradaHistorial,
        "jugadores/p1/puntosTotales": puntosTotalesP1,
        "jugadores/p2/puntosTotales": puntosTotalesP2,
        "rondaActual/estado": "cerrada"
    });
}

async function avanzarSiguienteRonda(codigo) {
    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    await iniciarSiguienteRonda(codigo, sala);
}

async function finalizarPartida(codigo) {
    await refSala(codigo).update({ estado: "finalizado" });
}

function guardarEnRanking(nombre, puntos, cantJugadas) {
    let mejoresJugadores = [];
    const guardado = localStorage.getItem("mejoresJugadores");
    if (guardado) mejoresJugadores = JSON.parse(guardado);

    const promedio = cantJugadas > 0 ? puntos / cantJugadas : 0;
    mejoresJugadores.push(new JugadorRankin(nombre, puntos, cantJugadas, promedio));

    localStorage.setItem("mejoresJugadores", JSON.stringify(mejoresJugadores));
}

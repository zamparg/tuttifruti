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
        ultimaActividadGeneral: Date.now(),
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
    await refSala(codigo).update({
        "jugadores/p2": { nombre: nombreJugador2, conectado: true, puntosTotales: 0 },
        ultimaActividadGeneral: Date.now()
    });
    return sala;
}

// Se actualiza en cada acción relevante del juego para saber si una sala sigue "viva".
async function marcarActividadGeneral(codigo) {
    await refSala(codigo).child("ultimaActividadGeneral").set(Date.now());
}

const HORAS_ABANDONO_SALA = 6;

// Barre /salas y borra las que llevan más de HORAS_ABANDONO_SALA sin actividad. Se llama al
// abrir el lobby (no requiere backend propio ni Cloud Functions, es limpieza "client-side").
async function limpiarSalasAbandonadas() {
    const snapshot = await db.ref("salas").get();
    if (!snapshot.exists()) return;

    const limite = Date.now() - HORAS_ABANDONO_SALA * 60 * 60 * 1000;
    const salas = snapshot.val();

    const borrados = Object.keys(salas).filter(codigo => {
        const sala = salas[codigo];
        const ultimaActividad = sala.ultimaActividadGeneral || 0;
        return ultimaActividad < limite;
    });

    await Promise.all(borrados.map(codigo => db.ref(`salas/${codigo}`).remove()));
}

function escucharSala(codigo, callback) {
    const ref = refSala(codigo);
    ref.on("value", snapshot => callback(snapshot.val()));
    return () => ref.off("value");
}

async function actualizarConfig(codigo, config) {
    const actualizaciones = { ultimaActividadGeneral: Date.now() };
    for (const clave of Object.keys(config)) {
        actualizaciones[`config/${clave}`] = config[clave];
    }
    await refSala(codigo).update(actualizaciones);
}

async function confirmarConfig(codigo, quienSoy) {
    await refSala(codigo).update({
        [`config/confirmadoPor/${quienSoy}`]: true,
        ultimaActividadGeneral: Date.now()
    });

    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    if (sala.config.confirmadoPor.p1 && sala.config.confirmadoPor.p2) {
        await iniciarSiguienteRonda(codigo, sala);
    }
}

// letraOculta=true: crea la ronda con los datos ya calculados pero sin revelar la letra
// hasta que ambos jugadores confirmen "Continuar" (ver confirmarContinuar).
async function iniciarSiguienteRonda(codigo, sala) {
    const letrasUsadas = sala.historial ? Object.values(sala.historial).map(h => h.letra) : [];
    const letra = elegirLetraRonda(sala.config.poolLetras, letrasUsadas);

    if (letra === null) {
        await finalizarPartida(codigo);
        return;
    }

    const rondaActual = {
        numero: letrasUsadas.length + 1,
        letra,
        revelada: false,
        confirmadoContinuar: { p1: false, p2: false },
        // El timer NO es una cuenta regresiva fija: se mide como inactividad desde la última tecla
        // presionada por CUALQUIERA de los dos jugadores. Mientras alguien escribe, se resetea a 60s.
        ultimaActividadTimestamp: null,
        estado: "esperando_revelar",
        respuestas: {
            p1: { valores: {}, noHayPosibles: {}, finalizado: false, finalizadoEn: null },
            p2: { valores: {}, noHayPosibles: {}, finalizado: false, finalizadoEn: null }
        }
    };

    await refSala(codigo).update({
        estado: "jugando",
        rondaActual,
        ultimaActividadGeneral: Date.now()
    });
}

// Cada jugador confirma que está listo para ver la letra nueva. Cuando ambos confirmaron,
// recién ahí se revela la letra y arranca el timer (evita que alguien vea la letra antes que el otro).
// En modo bot, la PC no tiene sesión propia que confirme, así que alcanza con que confirme p1.
async function confirmarContinuar(codigo, quienSoy) {
    await refSala(codigo).child(`rondaActual/confirmadoContinuar/${quienSoy}`).set(true);

    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    const confirmado = sala.rondaActual.confirmadoContinuar;
    const faltaConfirmarP2 = sala.modo !== "bot" && !confirmado.p2;

    if (confirmado.p1 && !faltaConfirmarP2 && !sala.rondaActual.revelada) {
        await refSala(codigo).update({
            "rondaActual/revelada": true,
            "rondaActual/estado": "en_curso",
            "rondaActual/ultimaActividadTimestamp": Date.now(),
            ultimaActividadGeneral: Date.now()
        });
    }
}

// Se llama en cada tecla presionada en cualquier categoría: guarda el valor y resetea el timer de
// inactividad a 60s para ambos jugadores (regla: si alguien escribe, el timer vuelve a 60).
async function enviarRespuesta(codigo, quienSoy, valores, noHayPosibles) {
    await refSala(codigo).update({
        [`rondaActual/respuestas/${quienSoy}/valores`]: valores,
        [`rondaActual/respuestas/${quienSoy}/noHayPosibles`]: noHayPosibles,
        "rondaActual/ultimaActividadTimestamp": Date.now(),
        ultimaActividadGeneral: Date.now()
    });
}

async function finalizarTurno(codigo, quienSoy, valores, noHayPosibles) {
    await refSala(codigo).update({
        [`rondaActual/respuestas/${quienSoy}/valores`]: valores,
        [`rondaActual/respuestas/${quienSoy}/noHayPosibles`]: noHayPosibles,
        [`rondaActual/respuestas/${quienSoy}/finalizado`]: true,
        [`rondaActual/respuestas/${quienSoy}/finalizadoEn`]: Date.now(),
        ultimaActividadGeneral: Date.now()
    });
}

const TIMER_SEGUNDOS_INACTIVIDAD = 60;

// Segundos restantes antes de que el timer llegue a 0 por inactividad. Ambos clientes lo calculan
// igual a partir de ultimaActividadTimestamp (compartido), así ven el mismo número.
function segundosRestantesPorInactividad(rondaActual) {
    if (!rondaActual.ultimaActividadTimestamp) return TIMER_SEGUNDOS_INACTIVIDAD;
    const transcurrido = (Date.now() - rondaActual.ultimaActividadTimestamp) / 1000;
    return Math.max(0, TIMER_SEGUNDOS_INACTIVIDAD - transcurrido);
}

// Un jugador finalizado sin ningún "no hay posibles" cierra el turno para ambos de inmediato.
// Un jugador finalizado con al menos un "no hay posibles" deja el turno abierto para el rival.
function turnoDebeCerrarse(rondaActual) {
    const { p1, p2 } = rondaActual.respuestas;

    if (segundosRestantesPorInactividad(rondaActual) <= 0) return true;
    if (p1.finalizado && p2.finalizado) return true;

    const tieneNoHayPosibles = (jugador) => Object.values(jugador.noHayPosibles || {}).some(v => v);

    if (p1.finalizado && !tieneNoHayPosibles(p1)) return true;
    if (p2.finalizado && !tieneNoHayPosibles(p2)) return true;

    return false;
}

// Solo la llama el cliente creador (p1), protegido con una transacción sobre rondaActual/estado.
// Relee la sala fresca desde Firebase justo antes de calcular: el "sala" que llega como parámetro
// puede ser un snapshot desactualizado (ej. capturado antes de que llegara la última respuesta del rival),
// y usar ese snapshot viejo hacía que el cálculo comparara contra respuestas vacías.
async function calcularYCerrarRonda(codigo) {
    const rondaRef = refSala(codigo).child("rondaActual");

    const resultadoTransaccion = await rondaRef.child("estado").transaction(estadoActual => {
        if (estadoActual !== "en_curso") return; // ya se está calculando o ya cerró, abortar
        return "calculando";
    });

    if (!resultadoTransaccion.committed) return;

    const snapshotFresco = await refSala(codigo).get();
    const sala = snapshotFresco.val();
    const rondaActual = sala.rondaActual;
    const { letra, respuestas } = rondaActual;
    const categorias = sala.config.categorias;

    const jugada1 = respuestas.p1.valores || {};
    const jugada2 = respuestas.p2.valores || {};

    const { puntosP1, puntosP2, detalle } = calcularPuntosRonda(
        jugada1, jugada2, letra, categorias,
        respuestas.p1.noHayPosibles, respuestas.p2.noHayPosibles
    );

    const puntosTotalesP1 = (sala.jugadores.p1.puntosTotales || 0) + puntosP1;
    const puntosTotalesP2 = (sala.jugadores.p2.puntosTotales || 0) + puntosP2;

    const entradaHistorial = new Jugada(letra, jugada1, puntosP1, puntosTotalesP1, jugada2, puntosP2, puntosTotalesP2);
    entradaHistorial.detallePorCategoria = detalle;

    const numeroRonda = rondaActual.numero;

    await refSala(codigo).update({
        [`historial/${numeroRonda - 1}`]: entradaHistorial,
        "jugadores/p1/puntosTotales": puntosTotalesP1,
        "jugadores/p2/puntosTotales": puntosTotalesP2,
        "rondaActual/estado": "cerrada",
        ultimaActividadGeneral: Date.now()
    });
}

async function avanzarSiguienteRonda(codigo) {
    const snapshot = await refSala(codigo).get();
    const sala = snapshot.val();
    await iniciarSiguienteRonda(codigo, sala);
}

async function finalizarPartida(codigo) {
    await refSala(codigo).update({
        estado: "finalizado",
        ultimaActividadGeneral: Date.now()
    });
}

function guardarEnRanking(nombre, puntos, cantJugadas) {
    let mejoresJugadores = [];
    const guardado = localStorage.getItem("mejoresJugadores");
    if (guardado) mejoresJugadores = JSON.parse(guardado);

    const promedio = cantJugadas > 0 ? puntos / cantJugadas : 0;
    mejoresJugadores.push(new JugadorRankin(nombre, puntos, cantJugadas, promedio));

    localStorage.setItem("mejoresJugadores", JSON.stringify(mejoresJugadores));
}

// --- DISPUTAS ---
// Cualquiera puede disputar una celda ya cerrada. Se guarda bajo historial/{indice}/disputas/{categoria}:
// { iniciadaPor, causaAcusador, estado: "abierta"|"resuelta", turno: "p1"|"p2" (a quién le toca responder),
//   argumentos: [{ autor, texto, tipo: "causa"|"aceptar"|"rechazar" }] }
// Se resuelve cuando alguien "acepta" el argumento del otro: la palabra del que fue cuestionado
// (o de quien aceptó que su palabra no vale) se invalida y se recalcula esa categoría.

function refDisputa(codigo, indiceHistorial, categoria) {
    return refSala(codigo).child(`historial/${indiceHistorial}/disputas/${categoria}`);
}

async function abrirDisputa(codigo, indiceHistorial, categoria, quienSoy, contraQuien, causa) {
    await refDisputa(codigo, indiceHistorial, categoria).set({
        iniciadaPor: quienSoy,
        contraQuien,
        estado: "abierta",
        turno: contraQuien,
        argumentos: [{ autor: quienSoy, tipo: "causa", texto: causa }]
    });
    await marcarActividadGeneral(codigo);
}

async function responderDisputa(codigo, indiceHistorial, categoria, quienSoy, tipo, texto) {
    const ref = refDisputa(codigo, indiceHistorial, categoria);
    const snapshot = await ref.get();
    const disputa = snapshot.val();
    if (!disputa || disputa.estado !== "abierta") return;

    const nuevosArgumentos = [...disputa.argumentos, { autor: quienSoy, tipo, texto: texto || "" }];
    const otroJugador = quienSoy === "p1" ? "p2" : "p1";

    if (tipo === "aceptar") {
        // Quien acepta reconoce que SU palabra en esa categoría no vale.
        await ref.update({
            argumentos: nuevosArgumentos,
            estado: "resuelta",
            invalidadoJugador: quienSoy
        });
        await recalcularCategoriaTrasDisputa(codigo, indiceHistorial, categoria, quienSoy);
    } else {
        // Rechaza y contra-argumenta: el turno pasa al otro jugador, sin límite de intercambios.
        await ref.update({
            argumentos: nuevosArgumentos,
            turno: otroJugador
        });
    }
}

async function recalcularCategoriaTrasDisputa(codigo, indiceHistorial, categoria, jugadorInvalidado) {
    const salaSnapshot = await refSala(codigo).get();
    const sala = salaSnapshot.val();
    const entrada = sala.historial[indiceHistorial];

    const jugada1 = { ...(entrada.jugadaJugador1 || {}) };
    const jugada2 = { ...(entrada.jugadaJugador2 || {}) };

    if (jugadorInvalidado === "p1") jugada1[categoria] = "";
    else jugada2[categoria] = "";

    const resultadoCategoria = calcularPuntoCategoria(jugada1[categoria], jugada2[categoria], entrada.letra, false, false);

    const detalle = entrada.detallePorCategoria || {};
    const anterior = detalle[categoria] || { p1: 0, p2: 0 };
    detalle[categoria] = resultadoCategoria;

    const nuevosPuntos1 = entrada.puntosJugador1 - anterior.p1 + resultadoCategoria.p1;
    const nuevosPuntos2 = entrada.puntosJugador2 - anterior.p2 + resultadoCategoria.p2;

    const diferencia1 = nuevosPuntos1 - entrada.puntosJugador1;
    const diferencia2 = nuevosPuntos2 - entrada.puntosJugador2;

    await refSala(codigo).update({
        [`historial/${indiceHistorial}/jugadaJugador1/${categoria}`]: jugada1[categoria],
        [`historial/${indiceHistorial}/jugadaJugador2/${categoria}`]: jugada2[categoria],
        [`historial/${indiceHistorial}/puntosJugador1`]: nuevosPuntos1,
        [`historial/${indiceHistorial}/puntosJugador2`]: nuevosPuntos2,
        [`historial/${indiceHistorial}/detallePorCategoria`]: detalle,
        [`historial/${indiceHistorial}/puntosTotalesJugador1`]: entrada.puntosTotalesJugador1 + diferencia1,
        [`historial/${indiceHistorial}/puntosTotalesJugador2`]: entrada.puntosTotalesJugador2 + diferencia2,
        "jugadores/p1/puntosTotales": sala.jugadores.p1.puntosTotales + diferencia1,
        "jugadores/p2/puntosTotales": sala.jugadores.p2.puntosTotales + diferencia2
    });

    // Las rondas posteriores ya calcularon su puntosTotales acumulado sobre el valor viejo;
    // se corrigen en cascada para que el acumulado siga siendo consistente.
    const indices = Object.keys(sala.historial).map(Number).filter(i => i > indiceHistorial).sort((a, b) => a - b);
    for (const indice of indices) {
        const siguiente = sala.historial[indice];
        await refSala(codigo).update({
            [`historial/${indice}/puntosTotalesJugador1`]: siguiente.puntosTotalesJugador1 + diferencia1,
            [`historial/${indice}/puntosTotalesJugador2`]: siguiente.puntosTotalesJugador2 + diferencia2
        });
    }
}

function hayDisputasAbiertas(entradaHistorial) {
    if (!entradaHistorial || !entradaHistorial.disputas) return false;
    return Object.values(entradaHistorial.disputas).some(d => d.estado === "abierta");
}

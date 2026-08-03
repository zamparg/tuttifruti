// Simulación del bot ("p2 simulado") con niveles de IQ. Escribe en Firebase como si fuera un jugador humano,
// para reusar el 100% de la pantalla de juego, timer y cálculo de puntos ya construidos para el modo online.
// Depende de: db (js/firebase-config.js), enviarRespuesta/finalizarTurno (js/sala.js).

const NIVELES_BOT = {
    facil: {
        delayMin: 0.40, delayMax: 0.90, // fracción del tiempo total de la ronda
        probNoHayPosibles: 0.35,
        probCompletaRonda: 0.45
    },
    medio: {
        delayMin: 0.15, delayMax: 0.65,
        probNoHayPosibles: 0.18,
        probCompletaRonda: 0.75
    },
    dificil: {
        delayMin: 0.05, delayMax: 0.35,
        probNoHayPosibles: 0.05,
        probCompletaRonda: 0.95
    }
};

// Cada categoría en BDJugada.json es un array de opciones; se descartan las vacías/blancas
// y se elige una al azar, para que el bot no repita siempre la misma palabra entre partidas.
function elegirPalabraAlAzar(opciones) {
    const validas = (opciones || []).filter(palabra => palabra && palabra.trim() !== "");
    if (validas.length === 0) return "";
    return validas[Math.floor(Math.random() * validas.length)];
}

async function simularJugadaBot(codigo, letra, categorias, nivelIQ, timerSegundos) {
    const config = NIVELES_BOT[nivelIQ] || NIVELES_BOT.medio;

    const snapshotBD = await fetch("../json/BDJugada.json").then(r => r.json());
    const jugadaBD = snapshotBD.find(elemento => elemento.letra === letra) || {};

    const valores = {};
    const noHayPosibles = {};

    const categoriasBarajadas = [...categorias].sort(() => Math.random() - 0.5);

    const vaACompletarRonda = Math.random() < config.probCompletaRonda;
    const categoriasAResponder = vaACompletarRonda
        ? categoriasBarajadas
        : categoriasBarajadas.slice(0, Math.floor(Math.random() * categoriasBarajadas.length));

    for (const categoria of categoriasAResponder) {
        const palabra = elegirPalabraAlAzar(jugadaBD[categoria]);
        const delayFraccion = config.delayMin + Math.random() * (config.delayMax - config.delayMin);
        const delayMs = delayFraccion * timerSegundos * 1000;

        await new Promise(resolve => setTimeout(resolve, delayMs));

        if (!palabra || Math.random() < config.probNoHayPosibles) {
            noHayPosibles[categoria] = true;
            valores[categoria] = "";
        } else {
            valores[categoria] = palabra;
        }

        await enviarRespuesta(codigo, "p2", valores, noHayPosibles);
    }

    await finalizarTurno(codigo, "p2", valores, noHayPosibles);
}

// Reglas de puntaje del Tutti Frutti, en funciones puras (sin DOM, sin globals mutables)

const PUNTOS = { perfecto: 20, bien: 10, repetido: 5, nada: 0 };

const CATEGORIAS = ["nombres", "animales", "colores", "lugares", "comidas", "objetos"];

const LETRAS = "abcdefghijklmnopqrstuvwxyz";

function calcularPuntoCategoria(valor1, valor2, letra, noHayPosibles1, noHayPosibles2) {
    const v1 = noHayPosibles1 ? "" : (valor1 || "").toLowerCase();
    const v2 = noHayPosibles2 ? "" : (valor2 || "").toLowerCase();

    if (v1 === v2 && v1 !== "" && v1[0] === letra) {
        return { p1: PUNTOS.repetido, p2: PUNTOS.repetido };
    } else if (v1 !== "" && v2 !== "" && v1[0] === letra && v2[0] === letra) {
        return { p1: PUNTOS.bien, p2: PUNTOS.bien };
    } else if ((v2 !== "" && v2[0] === letra) && (v1 === "" || v1[0] !== letra)) {
        return { p1: PUNTOS.nada, p2: PUNTOS.perfecto };
    } else if ((v1 !== "" && v1[0] === letra) && (v2 === "" || v2[0] !== letra)) {
        return { p1: PUNTOS.perfecto, p2: PUNTOS.nada };
    } else {
        return { p1: PUNTOS.nada, p2: PUNTOS.nada };
    }
}

function calcularPuntosRonda(jugada1, jugada2, letra, categorias, noHayPosibles1, noHayPosibles2) {
    noHayPosibles1 = noHayPosibles1 || {};
    noHayPosibles2 = noHayPosibles2 || {};

    let puntosP1 = 0;
    let puntosP2 = 0;
    const detalle = {};

    for (const categoria of categorias) {
        const resultado = calcularPuntoCategoria(
            jugada1[categoria],
            jugada2[categoria],
            letra,
            !!noHayPosibles1[categoria],
            !!noHayPosibles2[categoria]
        );
        detalle[categoria] = resultado;
        puntosP1 += resultado.p1;
        puntosP2 += resultado.p2;
    }

    return { puntosP1, puntosP2, detalle };
}

function elegirLetraRonda(poolLetras, letrasUsadas) {
    const disponibles = poolLetras.filter(l => !letrasUsadas.includes(l));
    if (disponibles.length === 0) return null;
    return disponibles[Math.floor(Math.random() * disponibles.length)];
}

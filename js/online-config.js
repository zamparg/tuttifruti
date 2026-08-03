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

if (!codigo || !quienSoy) {
    location.href = "../index.html";
}

const esCreador = quienSoy === "p1";

const soloCreador = document.getElementById("soloCreador");
const checksCategorias = document.getElementById("checksCategorias");
const checksLetras = document.getElementById("checksLetras");
const timerInput = document.getElementById("timer");
const btnGuardarConfig = document.getElementById("btnGuardarConfig");
const btnListo = document.getElementById("btnListo");
const estadoConfirmacion = document.getElementById("estadoConfirmacion");

if (!esCreador) {
    soloCreador.style.display = "none";
}

for (const categoria of CATEGORIAS) {
    checksCategorias.innerHTML += `
        <div class="col">
            <input type="checkbox" class="chkCategoria" value="${categoria}" checked ${esCreador ? "" : "disabled"}>
            <label>${categoria}</label>
        </div>`;
}

for (const letraChar of LETRAS.split("")) {
    checksLetras.innerHTML += `
        <div class="col-1">
            <input type="checkbox" class="chkLetra" value="${letraChar}" checked ${esCreador ? "" : "disabled"}>
            <label>${letraChar.toUpperCase()}</label>
        </div>`;
}

if (btnGuardarConfig) {
    btnGuardarConfig.onclick = async () => {
        const categoriasElegidas = [...document.querySelectorAll(".chkCategoria:checked")].map(c => c.value);
        const letrasElegidas = [...document.querySelectorAll(".chkLetra:checked")].map(c => c.value);
        const timer = parseInt(timerInput.value);

        if (categoriasElegidas.length === 0 || letrasElegidas.length === 0) {
            avisos("Elegí al menos una categoría y una letra.", 3000);
            return;
        }

        await actualizarConfig(codigo, {
            categorias: categoriasElegidas,
            poolLetras: letrasElegidas,
            timer
        });
        avisos("Configuración guardada.", 2000);
    };
}

btnListo.onclick = async () => {
    btnListo.setAttribute("disabled", "disabled");
    await confirmarConfig(codigo, quienSoy);
};

escucharSala(codigo, (sala) => {
    if (!sala) return;

    if (sala.estado === "jugando") {
        location.href = "online-juego.html";
        return;
    }

    const { p1, p2 } = sala.config.confirmadoPor;
    estadoConfirmacion.innerHTML = `<p>Jugador 1: ${p1 ? "listo ✔" : "esperando..."} — Jugador 2: ${p2 ? "listo ✔" : "esperando..."}</p>`;
});

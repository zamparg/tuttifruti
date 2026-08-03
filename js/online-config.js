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
const listaCategorias = document.getElementById("listaCategorias");
const inputNuevaCategoria = document.getElementById("inputNuevaCategoria");
const btnAgregarCategoria = document.getElementById("btnAgregarCategoria");
const grillaLetras = document.getElementById("grillaLetras");
const timerInput = document.getElementById("timer");
const btnGuardarConfig = document.getElementById("btnGuardarConfig");
const btnListo = document.getElementById("btnListo");
const estadoConfirmacion = document.getElementById("estadoConfirmacion");

let categoriasActuales = [...CATEGORIAS];
let esModoBot = false;

function renderCategorias() {
    const puedeEditar = esCreador && !esModoBot;
    listaCategorias.innerHTML = "";
    for (const categoria of categoriasActuales) {
        listaCategorias.innerHTML += `
            <div class="chipCategoria">
                <span>${categoria}</span>
                ${puedeEditar ? `<button type="button" class="btnQuitarCategoria" data-categoria="${categoria}">×</button>` : ""}
            </div>`;
    }
    if (puedeEditar) {
        for (const boton of listaCategorias.querySelectorAll(".btnQuitarCategoria")) {
            boton.onclick = () => {
                categoriasActuales = categoriasActuales.filter(c => c !== boton.dataset.categoria);
                renderCategorias();
            };
        }
    }
}

renderCategorias();

if (btnAgregarCategoria) {
    btnAgregarCategoria.onclick = () => {
        const nombre = inputNuevaCategoria.value.trim().toLowerCase();
        if (!nombre) return;
        if (categoriasActuales.includes(nombre)) {
            avisos("Esa categoría ya está agregada.", 2500);
            return;
        }
        categoriasActuales.push(nombre);
        inputNuevaCategoria.value = "";
        renderCategorias();
    };
}

for (const letraChar of LETRAS.split("")) {
    grillaLetras.innerHTML += `
        <label>
            <input type="checkbox" class="chkLetra" value="${letraChar}" checked ${esCreador ? "" : "disabled"}>
            ${letraChar.toUpperCase()}
        </label>`;
}

if (btnGuardarConfig) {
    btnGuardarConfig.onclick = async () => {
        const letrasElegidas = [...document.querySelectorAll(".chkLetra:checked")].map(c => c.value);
        const timer = parseInt(timerInput.value);

        if (categoriasActuales.length === 0 || letrasElegidas.length === 0) {
            avisos("Elegí al menos una categoría y una letra.", 3000);
            return;
        }

        await actualizarConfig(codigo, {
            categorias: categoriasActuales,
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

    esModoBot = sala.modo === "bot";
    if (esModoBot && esCreador) {
        const nuevaCategoriaFila = inputNuevaCategoria.closest(".renglon");
        if (nuevaCategoriaFila) nuevaCategoriaFila.style.display = "none";
    }

    if (!esCreador) {
        soloCreador.style.display = "none";
    }

    if (sala.config && sala.config.categorias) {
        categoriasActuales = [...sala.config.categorias];
        renderCategorias();
    }

    const { p1, p2 } = sala.config.confirmadoPor;
    estadoConfirmacion.innerHTML = `<p>Jugador 1: ${p1 ? "listo ✔" : "esperando..."} — Jugador 2: ${p2 ? "listo ✔" : "esperando..."}</p>`;
});

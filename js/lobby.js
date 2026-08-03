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

const formCrearSala = document.getElementById("formCrearSala");
const formUnirseSala = document.getElementById("formUnirseSala");
const formJugarBot = document.getElementById("formJugarBot");
const codigoGenerado = document.getElementById("codigoGenerado");
const textoCodigoGenerado = document.getElementById("textoCodigoGenerado");

formCrearSala.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreCreador").value.trim();
    if (!nombre) return;

    try {
        const codigo = await crearSala(nombre, "online");
        sessionStorage.setItem("codigoSala", codigo);
        sessionStorage.setItem("quienSoy", "p1");
        sessionStorage.setItem("nombreJugador", nombre);

        textoCodigoGenerado.textContent = codigo;
        codigoGenerado.style.display = "";

        // Escucha hasta que el jugador 2 se una, luego avanza a la config.
        const detener = escucharSala(codigo, (sala) => {
            if (sala && sala.jugadores && sala.jugadores.p2) {
                detener();
                location.href = "pages/online-config.html";
            }
        });
    } catch (error) {
        avisos(error.message, 3000);
    }
});

formUnirseSala.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreInvitado").value.trim();
    const codigo = document.getElementById("codigoSala").value.trim().toUpperCase();
    if (!nombre || !codigo) return;

    try {
        await unirseSala(codigo, nombre);
        sessionStorage.setItem("codigoSala", codigo);
        sessionStorage.setItem("quienSoy", "p2");
        sessionStorage.setItem("nombreJugador", nombre);
        location.href = "pages/online-config.html";
    } catch (error) {
        avisos(error.message, 3000);
    }
});

formJugarBot.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreJugadorBot").value.trim();
    const nivel = document.getElementById("nivelBot").value;
    if (!nombre) return;

    const codigo = await crearSala(nombre, "bot");
    await refSala(codigo).update({
        nivelBot: nivel,
        "jugadores/p2": { nombre: "PC", conectado: true, puntosTotales: 0 }
    });

    sessionStorage.setItem("codigoSala", codigo);
    sessionStorage.setItem("quienSoy", "p1");
    sessionStorage.setItem("nombreJugador", nombre);
    location.href = "pages/online-config.html";
});

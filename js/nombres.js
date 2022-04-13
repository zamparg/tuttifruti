let nombres = document.getElementById("recibidorDeNombres")

nombres.addEventListener("submit", recibiendoNombres)

function recibiendoNombres(e){
    e.preventDefault();
    let nombre1
    let nombre2
    let timer

    nombre1 = document.getElementById('nombre1').value; 
    nombre2 = document.getElementById('nombre2').value;
    timer=document.getElementById(`timer`).value

    sessionStorage.setItem(`nombreJugador1`, nombre1);
    sessionStorage.setItem(`nombreJugador2`, nombre2);
    sessionStorage.setItem(`timer`, timer);
}
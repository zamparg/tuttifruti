// JUGADA DEL USUARIO
let letra
let jugadas=[]
let jugador1= sessionStorage.getItem(`nombreJugador1`);
let nombres1
let animales1
let colores1
let lugares1
let comidas1
let objetos1
let puntosJugador1=0
let puntosTotalesJugador1=0

// JUGADA DEL USUARIO2 (LUEGO PUEDE SER UNA LISTA, PARA JUGAR CONTRA LA PC)
let jugador2= sessionStorage.getItem(`nombreJugador2`);    
let nombres2
let animales2
let colores2
let lugares2
let comidas2
let objetos2
let puntosJugador2=0
let puntosTotalesJugador2=0

// CONSTANTES DE PUNTOS
const perfecto = 20;
const bien = 10;
const repetido = 5;
const nada = 0;

// ELEMENTOS DEL DOM
let cuaderno = document.getElementById("cuaderno");
let puntajeTotal1 = document.getElementById("puntosJugador1")
let puntajeTotal2 = document.getElementById("puntosJugador2")
let espacioJugador1 = document.getElementById("espacioJugador1")
let espacioJugador2 = document.getElementById("espacioJugador2")
let renglones = document.getElementById("renglones")
let renglonGanador = document.getElementById("renglonGanador")
let margenInferior = document.getElementById("margenInferior")

espacioJugador1.innerHTML = `
    <p class ="jugador1">${jugador1}</p>`
espacioJugador2.innerHTML = `
    <p class ="jugador2">${jugador2}</p>`

// BOTONES

let botones = `
    <div class="renglon container-fluid row text-center" id="renglonBotones">
        <div class="col-1 margenIzquierdo">
        </div>
        <div class="col">
            <button class="boton1" id="btnSeguir">Seguir Jugando</button>
        </div>
        <div class="col">
            <button class="boton2" id="btnTerminar">Terminar partida</button>
        </div>
    </div>`

let botonesFinales = `
    <div class ="row">
        <div class="col">
            <button class="boton1" id="btnRanking">Ver Ranking</button>
        </div>
        <div class="col">
            <a href="../index.html"><button class="boton2" id="btnReset">Volver a Jugar</button></a>
        </div>
    </div>`

let botonVolverAJugar = `
    <div class="container-fluid row renglonFinal text-center">
        <div class="col-1 margenIzquierdo footer"></div>
        <div class="col">
            <a href="../index.html"><button class="boton3">Volver a Jugar</button> </a>
        </div>
    </div>`

// MEJORES JUGADORES

let mejoresJugadores = [ ];

if(localStorage.getItem("mejoresJugadores"))    {
    mejoresJugadores = JSON.parse(localStorage.getItem(`mejoresJugadores`));
} else {
    localStorage.setItem(`mejoresJugadores`, JSON.stringify(mejoresJugadores))
}


// FUNCIONES

function elegirLetra (){

    const letras ="abcdefghijklmnopqrstuvwxyz"

    do{
        letra = letras[(parseInt(Math.random()*25))];
    } while (jugadas.some(jugada=>jugada.letra==letra) )
    
    let espacioLetra1 = document.getElementById ("espacioLetra1");
    let espacioLetra2 = document.getElementById ("espacioLetra2");

    espacioLetra1.innerHTML = `
        <p>${letra.toUpperCase()}</p>
    `
    espacioLetra2.innerHTML = `
        <p>${letra.toUpperCase()}</p>
    `
}

function calculoDePuntos (elemento1,elemento2){
    if (elemento1==elemento2 && elemento1!="" && elemento1[0]===letra){
        puntosJugador1+=repetido;
        puntosJugador2+=repetido;
    } else if (elemento1!="" && elemento2!="" && elemento1[0]===letra && elemento2[0]===letra){
        puntosJugador1+=bien;
        puntosJugador2+=bien;
    } else if ((elemento2!="" && elemento2[0]===letra) && (elemento1=="" || elemento1[0]!=letra)){
        puntosJugador1+=nada;
        puntosJugador2+=perfecto;
    }else if ((elemento1!=""  && elemento1[0]===letra) && (elemento2=="" || elemento2[0]!=letra)){
        puntosJugador1+=perfecto;
        puntosJugador2+=nada;
    } else {
        puntosJugador1+=nada;
        puntosJugador2+=nada;
    }
}

function escribirJugada(){
    renglones.innerHTML += `
        <div class="renglon container-fluid row text-center">
            <div class="col-1 margenIzquierdo">
            <p class="jugador1">${jugador1}:</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${letra.toUpperCase()}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${nombres1}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${animales1}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${colores1}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${lugares1}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${comidas1}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${objetos1}</p>
            </div>
            <div class="col jugador1">
                <p>${puntosJugador1}</p>
            </div>
        </div>
        <div class="renglon container-fluid row text-center">
            <div class="col-1 margenIzquierdo">
            <p class="jugador2">${jugador2}:</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${letra.toUpperCase()}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${nombres2}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${animales2}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${colores2}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${lugares2}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${comidas2}</p>
            </div>
            <div class="col lineaDivisoria">
                <p>${objetos2}</p>
            </div>
            <div class="col jugador2">
                <p>${puntosJugador2}</p>
            </div>
        </div>
    `
}

function escribirPuntos(){
    puntajeTotal1.innerHTML = `
    <p class="jugador1"> ${jugador1}: ${puntosTotalesJugador1} puntos.</p>
    `
    puntajeTotal2.innerHTML = `
    <p class="jugador2"> ${jugador2}: ${puntosTotalesJugador2} puntos.</p>
    `
}

function recordar(){
   
    let mejoresJugadas1 =jugadas.filter(jugada => jugada.puntosJugador1 > jugada.puntosJugador2);
    let mejoresJugadas2 =jugadas.filter(jugada => jugada.puntosJugador1 < jugada.puntosJugador2);
    let jugadasEmpatadas =jugadas.filter(jugada => jugada.puntosJugador1 == jugada.puntosJugador2);

    mejoresJugadas1 = mejoresJugadas1.map(jugada =>   {
        return {
            letra:jugada.letra, 
            jugada:jugada.jugadaJugador1,
            puntos:jugada.puntosJugador1
        }
    })

    mejoresJugadas2 = mejoresJugadas2.map(jugada =>   {
        return {
            letra:jugada.letra, 
            jugada:jugada.jugadaJugador2,
            puntos:jugada.puntosJugador2
        }
    })

    jugadasEmpatadas = jugadasEmpatadas.map(jugada =>   {
        return {
            letra:jugada.letra, 
            jugadaJugador1:jugada.jugadaJugador1,
            jugadaJugador2:jugada.jugadaJugador2,
            puntos:jugada.puntosJugador2
        }
    })

    console.log(`Mejores Jugadas de ${jugador1}`)
    console.log(mejoresJugadas1)
    console.log(`Mejores Jugadas de ${jugador2}`)
    console.log(mejoresJugadas2)
    console.log(`Jugadas con empate`)
    console.log(jugadasEmpatadas)
}

function preguntar (){
    cuaderno.innerHTML += botones

    let btnSeguir = document.getElementById("btnSeguir")
    let btnTerminar = document.getElementById("btnTerminar")
    
    btnSeguir.onclick = () => {
        for (let input of  document.getElementsByClassName("espacioInput1")) {
            input.removeAttribute("disabled");
          }
        puntosJugador1=0
        puntosJugador2=0
        cuaderno.removeChild(cuaderno.lastChild)
        
        jugar();
    }

    btnTerminar.onclick = () =>{
        
        escribirPuntos();

        cuaderno.removeChild(cuaderno.lastChild)

        if (puntosTotalesJugador1 > puntosTotalesJugador2){
            
            renglonGanador.innerHTML=`
            <h3 class="jugador1">
            ¡El ganador de toda la partida es ${jugador1}! ¡Con ${puntosTotalesJugador1} puntos!
            </h3>`

            const mejorJugador = new JugadorRankin (jugador1, puntosTotalesJugador1, jugadas.length, (puntosTotalesJugador1/(jugadas.length)))
            mejoresJugadores.push(mejorJugador);

        }else if (puntosTotalesJugador1 < puntosTotalesJugador2){
            
            renglonGanador.innerHTML=`
            <h3 class="jugador2">
            ¡El ganador de toda la partida es ${jugador2}! ¡Con ${puntosTotalesJugador2} puntos!
            </h3>`
            
            const mejorJugador = new JugadorRankin (jugador2, puntosTotalesJugador2, jugadas.length, (puntosTotalesJugador2/(jugadas.length)))
            mejoresJugadores.push(mejorJugador);

        }else {
            renglonGanador.innerHTML=`
            <h3>
            ¡Este juego ha resultado en un empate, señoras y señores! ¡Con ${puntosTotalesJugador1} puntos cada uno!
            </h3>`
        }

        localStorage.setItem("mejoresJugadores", JSON.stringify(mejoresJugadores));

        renglonGanador.innerHTML += botonesFinales

        let btnRanking = document.getElementById("btnRanking");

        btnRanking.onclick =() =>{
            cuaderno.innerHTML=""
            renglones.innerHTML=""
            margenInferior.innerHTML=""

            cuaderno.innerHTML+= `
            <div class="renglon container-fluid row text-center">
                <div class="col-1 margenIzquierdo"></div>
                <div class="col">
                    <h2>TOP TEN</h2>
                </div>
            </div>
            <div class="renglon container-fluid row text-center">
                <div class="col-1 margenIzquierdo"></div>
                <div class="col lineaDivisoria">
                    <h2>Nombre</h2>
                </div>
                <div class="col lineaDivisoria">
                    <h2>Puntos</h2>
                </div>
                <div class="col lineaDivisoria">
                    <h2>Cantidad de Jugadas</h2>
                </div>
            </div>
            `

            margenInferior.innerHTML+=botonVolverAJugar;

            mejoresJugadores.sort((a, b) => {
                if (a.promedio > b.promedio) {
                    return -1;
                } else if (a.promedio < b.promedio) {
                    return 1;
                } else {
                    return 0;
                }
            })
         
            for (let indice = 0; indice <= 9; indice++){
                cuaderno.innerHTML+=`
                <div class="renglon container-fluid row text-center">
                    <div class="col-1 margenIzquierdo">
                        <h3>${indice+1}<h3>
                    </div>
                    <div class="col lineaDivisoria">
                        <h3>${mejoresJugadores[indice].nombre}</h3>
                    </div>
                    <div class="col lineaDivisoria">
                        <h3>${mejoresJugadores[indice].puntos}</h3>
                    </div>
                    <div class="col lineaDivisoria">
                        <h3>${mejoresJugadores[indice].cantJugadas}</h3>
                    </div>
                </div> 
                `
            }

            
        }
        recordar();
        
    }
}

function jugar (){ 
    elegirLetra()

    for (let input of  document.getElementsByClassName("espacioInput2")) {
        input.setAttribute("disabled", "disabled");
    }

    let datos1 = document.getElementById("recibidorDeDatos1");
    let datos2= document.getElementById("recibidorDeDatos2");

    datos1.addEventListener("submit", recibiendoDatos1)
    datos2.addEventListener("submit", recibiendoDatos2);

    function recibiendoDatos1 (e) {
        e.preventDefault();

        nombres1 = (document.getElementById('espacioNombres1').value).toLowerCase(); 
        animales1 = (document.getElementById('espacioAnimales1').value).toLowerCase();
        colores1 = (document.getElementById('espacioColores1').value).toLowerCase();
        lugares1 = (document.getElementById('espacioLugares1').value).toLowerCase();
        comidas1 = (document.getElementById('espacioComidas1').value).toLowerCase();
        objetos1 = (document.getElementById('espacioObjetos1').value).toLowerCase();

        datos1.reset();

        for (let input of  document.getElementsByClassName("espacioInput1")) {
            input.setAttribute("disabled", "disabled");
        }
        for (let input of  document.getElementsByClassName("espacioInput2")) {
            input.removeAttribute("disabled");
        }        
    }

    function recibiendoDatos2 (e){
        e.preventDefault ();

        nombres2 = (document.getElementById('espacioNombres2').value).toLowerCase(); 
        animales2 = (document.getElementById('espacioAnimales2').value).toLowerCase();
        colores2 = (document.getElementById('espacioColores2').value).toLowerCase();
        lugares2 = (document.getElementById('espacioLugares2').value).toLowerCase();
        comidas2 = (document.getElementById('espacioComidas2').value).toLowerCase();
        objetos2 = (document.getElementById('espacioObjetos2').value).toLowerCase();

        calculoDePuntos(nombres1,nombres2)
        calculoDePuntos(animales1,animales2)
        calculoDePuntos(colores1,colores2)
        calculoDePuntos(lugares1,lugares2)
        calculoDePuntos(comidas1,comidas2)
        calculoDePuntos(objetos1,objetos2)

        escribirJugada();

        puntosTotalesJugador1 += puntosJugador1;
        puntosTotalesJugador2 += puntosJugador2;

        let jugadaJugador1 = new JugadaJugador(nombres1, animales1, colores1, lugares1, comidas1, objetos1)
        let jugadaJugador2 = new JugadaJugador(nombres2, animales2, colores2, lugares2, comidas2, objetos2)
        let jugada = new Jugada (letra, jugadaJugador1, puntosJugador1, puntosTotalesJugador1, jugadaJugador2, puntosJugador2,puntosTotalesJugador2);
        
        jugadas.push(jugada)
        //console.log(jugadas)

        datos2.reset();
        for (let input of  document.getElementsByClassName("espacioInput2")) {
            input.setAttribute("disabled", "disabled");
        }
        
        
        preguntar();
    }
}

// JUGADA

jugar();


/*

Guardar en local los puntos totales de cada jugador y cantidad de jugadas (jugadas.length). Ordenar por promedio.
Ponerlos en el Margen inferior. 

Que los puntos de cada jugada, aparezcan en el DOM. 

*/

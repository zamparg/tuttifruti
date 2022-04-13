let letra
let jugadas=[]

// JUGADA DEL USUARIO 1
let jugador1= sessionStorage.getItem(`nombreJugador1`);
let jugada1={};
let puntosJugador1=0
let puntosTotalesJugador1=0

// JUGADA DEL USUARIO2
let jugador2= sessionStorage.getItem(`nombreJugador2`);
let jugada2 = {};    
let puntosJugador2=0
let puntosTotalesJugador2=0

//CONFIGURACIÓN DEL TIMER
let setTimer = parseInt(sessionStorage.getItem(`timer`))

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

// MEJORES JUGADORES - RANKIN

let mejoresJugadores = [ ];

localStorage.getItem("mejoresJugadores")? mejoresJugadores = JSON.parse(localStorage.getItem(`mejoresJugadores`)): localStorage.setItem(`mejoresJugadores`, JSON.stringify(mejoresJugadores))


// FUNCIONES

function avisos(aviso, duracion){
    Toastify({
        text: aviso, 
        duration: duracion,
        gravity: 'top',
        position: 'center',
        offset: {
            y: 200
          },
        style: {
            background: "linear-gradient(to right, #a0bcd6, #d6a0bc)",
          },
    }).showToast();
}

function elegirLetra (){ // Selecciona una letra al azar, evita que se repitan.

    const letras ="abcdefghijklmnopqrstuvwxyz"

    do{
        letra = letras[(parseInt(Math.random()*26))];
    } while (jugadas.some(jugada=>jugada.letra==letra) )
    
    avisos(`¡Vamos a jugar con la letra "${letra.toUpperCase()}"`,3000)

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
    const {
        nombres:nombres1,
        animales:animales1,
        colores:colores1,
        lugares:lugares1,
        comidas:comidas1,
        objetos:objetos1
    }=jugada1

    const {
        nombres:nombres2,
        animales:animales2,
        colores:colores2,
        lugares:lugares2,
        comidas:comidas2,
        objetos:objetos2
    }=jugada2

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
    avisos(`¡Adelante ${jugador1}!`, 2000)
    
    let nombres;
    let animales;
    let colores;
    let lugares;
    let comidas;
    let objetos;

    let timer

    let cuentaRegresivaTimer

    let jugadaPC = {}
    let cantPalabrasPC =1;

    for (let input of  document.getElementsByClassName("espacioInput2")) {
        input.setAttribute("disabled", "disabled");
    }

    let datos1 = document.getElementById("recibidorDeDatos1");
    let datos2= document.getElementById("recibidorDeDatos2");
 
    // TEMPORIZADOR con avisos toastify en base al TIMER configurado en INDEX
    function cuentaRegresiva() {

        Toastify({
            text: `Tenés ${setTimer} segundos `,
            duration: 3000,
            gravity: 'bottom',
            position: 'left',
            style: {
                background: "linear-gradient(to right, #EAE480, #eaaf80)",
            },
        }).showToast();

        timer = (setTimer-10);

        cuentaRegresivaTimer = setInterval( ()=>{
            Toastify({
                text: `Quedan ${timer} segundos `,
                duration: 3000,
                gravity: 'bottom',
                position: 'left',
                style: {
                    background: "linear-gradient(to right, #EAE480, #eaaf80)",
                },
            }).showToast();

            timer -=10;
            
            if (timer==0){
                clearInterval(cuentaRegresivaTimer)
                }
        }, 10000)

        const interval = setInterval( () =>{
            cantPalabrasPC++
            if (cantPalabrasPC==6){
                clearInterval(interval)
                }
        },(setTimer/6)*1000)
    }

    cuentaRegresiva()

    // Inicio de cuenta regresiva Jugador1. Si el jugador1 no presiona el botón "Enviar Jugada", al acabar el tiempo se envía.
    const cuentaRegresivaJugador1 = setTimeout(() =>{
        recuperarDatos1()
    }, (setTimer*1000))
    
    let cuentaRegresivaJugador2;
    
    // EVENTOS

    datos1.addEventListener("submit", recibiendoDatos1);
    datos2.addEventListener("submit", recibiendoDatos2);

    function recibiendoDatos1 (e) {
        e.preventDefault();
        recuperarDatos1()
        clearTimeout(cuentaRegresivaJugador1)
    }
    
    function recibiendoDatos2 (e){
        e.preventDefault ();
        recuperarDatos2()
        clearTimeout(cuentaRegresivaJugador2)
    }
    
    /*RecuperarDatos toma los "values" del DOM, inhabilita los inputs, habilita los del jugador 2
    Si el jugador es una persona, inicia cuenta regresiva. Si es PC, llama a la base de datos Con Fetch.
    Luego el comportamiento de jugador2 o PC es similar. Recupera los datos, inhabilita los input, calcula los puntos, 
    escribe la jugada y genera botones en el DOM para continuar o terminar.
    */
    
    function recuperarDatos1 () {       
        nombres = (document.getElementById('espacioNombres1').value).toLowerCase(); 
        animales = (document.getElementById('espacioAnimales1').value).toLowerCase();
        colores = (document.getElementById('espacioColores1').value).toLowerCase();
        lugares = (document.getElementById('espacioLugares1').value).toLowerCase();
        comidas = (document.getElementById('espacioComidas1').value).toLowerCase();
        objetos = (document.getElementById('espacioObjetos1').value).toLowerCase();

        jugada1 = new JugadaJugador (nombres,animales,colores,lugares,comidas,objetos)

        datos1.reset();

        for (let input of  document.getElementsByClassName("espacioInput1")) {
            input.setAttribute("disabled", "disabled");
        }
        for (let input of  document.getElementsByClassName("espacioInput2")) {
            input.removeAttribute("disabled");
        }
        
        clearInterval(cuentaRegresivaTimer)
        
        if (jugador2 == "XLR3000") {  
        fetch(`../json/BDJugada.json`)
            .then(promesa=> promesa.json())
            .then(data => {
                jugadaPC=data.find((elemento) => elemento.letra == letra)
                RecuperarDatosPC()
            })
        }else {
            cuentaRegresiva();
            cuentaRegresivaJugador2 = setTimeout(() =>{
                recuperarDatos2()
            }, (setTimer*1000))
            avisos(`¡Ahora es turno de ${jugador2}!`,2000)
        }  
    }

    function recuperarDatos2(){
        
        nombres = (document.getElementById('espacioNombres2').value).toLowerCase(); 
        animales = (document.getElementById('espacioAnimales2').value).toLowerCase();
        colores = (document.getElementById('espacioColores2').value).toLowerCase();
        lugares = (document.getElementById('espacioLugares2').value).toLowerCase();
        comidas = (document.getElementById('espacioComidas2').value).toLowerCase();
        objetos = (document.getElementById('espacioObjetos2').value).toLowerCase();
    

        jugada2 = new JugadaJugador (nombres,animales,colores,lugares,comidas,objetos)
        
        calculoDePuntos(jugada1.nombres,jugada2.nombres)
        calculoDePuntos(jugada1.animales,jugada2.animales)
        calculoDePuntos(jugada1.colores,jugada2.colores)
        calculoDePuntos(jugada1.lugares,jugada2.lugares)
        calculoDePuntos(jugada1.comidas,jugada2.comidas)
        calculoDePuntos(jugada1.objetos,jugada2.objetos)

        if (puntosJugador1 > puntosJugador2){
            avisos(`¡El ganador es ${jugador1}!`,3000)
        } else if (puntosJugador1 < puntosJugador2,3000){
            avisos(`¡El ganador es ${jugador2}!`, 3000)
        } else {
            avisos(`¡Es un empate!`)
        }

        escribirJugada();

        puntosTotalesJugador1 += puntosJugador1;
        puntosTotalesJugador2 += puntosJugador2;

        let jugada = new Jugada (letra, jugada1, puntosJugador1, puntosTotalesJugador1, jugada2, puntosJugador2,puntosTotalesJugador2);
        
        jugadas.push(jugada)

        datos2.reset();
        for (let input of  document.getElementsByClassName("espacioInput2")) {
            input.setAttribute("disabled", "disabled");
        }
        
        clearInterval(cuentaRegresivaTimer);
        preguntar();
    }

    function RecuperarDatosPC (){

        if(cantPalabrasPC>=1){nombres= jugadaPC.nombres}else{nombres=""}
        if(cantPalabrasPC>=2){animales=jugadaPC.animales}else{animales=""}
        if(cantPalabrasPC>=3){colores= jugadaPC.colores}else{colores=""}
        if(cantPalabrasPC>=4){lugares= jugadaPC.lugares}else{lugares=""}
        if(cantPalabrasPC>=5){comidas= jugadaPC.comidas}else{comidas=""}
        if(cantPalabrasPC==6){objetos= jugadaPC.objetos}else{objetos=""}


        jugada2 = new JugadaJugador (nombres,animales,colores,lugares,comidas,objetos)
            
        calculoDePuntos(jugada1.nombres,jugada2.nombres)
        calculoDePuntos(jugada1.animales,jugada2.animales)
        calculoDePuntos(jugada1.colores,jugada2.colores)
        calculoDePuntos(jugada1.lugares,jugada2.lugares)
        calculoDePuntos(jugada1.comidas,jugada2.comidas)
        calculoDePuntos(jugada1.objetos,jugada2.objetos)
        
        if (puntosJugador1 > puntosJugador2){
            avisos(`¡El ganador es ${jugador1}!`,3000)
        } else if (puntosJugador1 < puntosJugador2,3000){
            avisos(`¡El ganador es ${jugador2}!`, 3000)
        } else {
            avisos(`¡Es un empate!`)
        }

        escribirJugada();
        puntosTotalesJugador1 += puntosJugador1;
        puntosTotalesJugador2 += puntosJugador2;
    
        let jugada = new Jugada (letra, jugada1, puntosJugador1, puntosTotalesJugador1, jugada2, puntosJugador2,puntosTotalesJugador2);
        
        jugadas.push(jugada)
    
        datos2.reset();
        for (let input of  document.getElementsByClassName("espacioInput2")) {
            input.setAttribute("disabled", "disabled");
        }
        
        clearInterval(cuentaRegresivaTimer);
        preguntar();
    }
}

// JUGADA

jugar();
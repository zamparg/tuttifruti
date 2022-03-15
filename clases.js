// CONSTRUCTORES

class JugadaJugador{
    constructor (nombres,animales,colores, lugares,comidas, objetos){
        this.nombres= nombres;
        this.animales=animales;
        this.colores= colores;
        this.lugares=lugares;
        this.comidas=comidas;
        this.objetos=objetos;
    }
}

class Jugada {
    constructor (letra, jugadaJugador1, puntosJugador1, puntosTotalesJugador1, jugadaJugador2, puntosJugador2, puntosTotalesJugador2){
        this.letra=letra,
        this.jugadaJugador1=jugadaJugador1;
        this.puntosJugador1=puntosJugador1;
        this.puntosTotalesJugador1=puntosTotalesJugador1;
        this.jugadaJugador2=jugadaJugador2;
        this.puntosJugador2=puntosJugador2;
        this.puntosTotalesJugador2=puntosTotalesJugador2;
    }
} 

class JugadorRankin {
    constructor (nombre, puntos, cantJugadas, promedio){
        this.nombre = nombre;
        this.puntos= puntos;
        this.cantJugadas=cantJugadas;
        this.promedio=promedio;
    }
}
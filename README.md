# TuttiFruti

El clásico juego del TuttiFruti para disfrutar en versión digital, ahora online:
invitá a un amigo con un código de sala y jueguen simultáneamente desde dos PCs distintas,
o jugá contra la PC eligiendo su nivel de IQ.

## Cómo jugar

1. Abrí `index.html`: creá una sala (te da un código para compartir), unite con un código,
   o jugá contra la PC.
2. Si jugás online, ambos acuerdan categorías, letras y timer antes de arrancar.
3. En cada ronda ambos escriben al mismo tiempo. Podés marcar "No hay posibles" en una
   categoría si no se te ocurre nada. El botón "Finalizar" cierra tu jugada; si finalizaste
   con todo completo, la ronda se cierra para los dos, pero si finalizaste con algún
   "no hay posibles", el reloj sigue corriendo para tu rival.
4. La partida termina cuando se acaban las letras acordadas.

## Poner en marcha tu propio Firebase

El modo online usa Firebase Realtime Database (gratis) para sincronizar la sala entre
los dos jugadores. Las instrucciones paso a paso están en `js/firebase-config.js`.

## Tecnologías aplicadas:
* JAVASCRIPT
* HTML
* CSS3
* BOOTSTRAP 5.1
* SASS
* Firebase Realtime Database

## Contenido del Repositorio:

* `index.html` — lobby (crear sala / unirse / jugar contra la PC)
* `pages/online-config.html` — acuerdo de categorías, letras y timer
* `pages/online-juego.html` — pantalla de juego simultáneo
* Archivos de Estilo (css y sass)
* Código Javascript (clases, reglas de puntaje, sala Firebase, bot con niveles de IQ)
* Base de datos en Json con jugada automática de la PC

## Contenido desarrollado por:

**Gastón Zampar**

*Balder Project*

En el marco del Curso de Javascript, brindado por *CoderHouse*
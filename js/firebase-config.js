// PASO A PASO para conectar tu propio Firebase (gratis, sin tarjeta):
// 1. Entrá a https://console.firebase.google.com/ e iniciá sesión con tu cuenta de Google.
// 2. "Agregar proyecto" -> ponele un nombre (ej. "tuttifrutti") -> podés desactivar Google Analytics -> Crear.
// 3. En el menú lateral: Compilación -> Realtime Database -> Crear base de datos.
//    - Elegí una ubicación (cualquiera cercana sirve).
//    - Elegí "Comenzar en modo de prueba" (reglas abiertas por 30 días; ver nota de reglas abajo para dejarlas
//      permanentemente abiertas para este juego casual, sin datos sensibles).
// 4. En el ícono de engranaje (arriba a la izquierda) -> "Configuración del proyecto".
// 5. Bajá hasta "Tus apps" -> ícono "</>" (Web) -> registrá una app (con cualquier nombre, no hace falta Hosting).
// 6. Firebase te muestra un objeto "firebaseConfig" - copialo y pegalo reemplazando el de abajo.
// 7. En Realtime Database -> pestaña "Reglas", pegá esto y publicá (deja lectura/escritura abierta,
//    suficiente para un juego casual entre amigos sin login):
//    {
//      "rules": {
//        ".read": true,
//        ".write": true
//      }
//    }

const firebaseConfig = {
  apiKey: "AIzaSyAza1HqwHS8EildvrtBz54lmc-2g7RTcr0",
  authDomain: "tuttifrutti-7d092.firebaseapp.com",
  databaseURL: "https://tuttifrutti-7d092-default-rtdb.firebaseio.com",
  projectId: "tuttifrutti-7d092",
  storageBucket: "tuttifrutti-7d092.firebasestorage.app",
  messagingSenderId: "38513902386",
  appId: "1:38513902386:web:0215ec7a3b7c7e3917cd2b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

import { preguntas } from '../ContenidoExtra/preguntasMinijuego.js';

// --- BLOQUEO DE ACCESO SIN SESION ---
// --- BLOQUEO DE ACCESO SIN SESION ---
const usuarioActual = JSON.parse(localStorage.getItem('usuario'));

if (!usuarioActual || !usuarioActual.nick) {

  // Crear fondo del modal
  const modal = document.createElement("div");
  modal.id = "modalInicioSesion";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "99999";

  // Contenedor
  const contenido = document.createElement("div");
  contenido.style.background = "#fff";
  contenido.style.padding = "25px";
  contenido.style.width = "330px";
  contenido.style.borderRadius = "12px";
  contenido.style.textAlign = "center";
  contenido.style.boxShadow = "0 5px 15px rgba(0,0,0,0.25)";
  contenido.style.animation = "modalAppear 0.3s ease";

  // Título
  const titulo = document.createElement("h2");
  titulo.textContent = "⚠️ Acceso restringido";
  titulo.style.marginBottom = "10px";

  // Texto
  const texto = document.createElement("p");
  texto.textContent = "Debes iniciar sesión para acceder al minijuego.";
  texto.style.fontSize = "16px";

  // Botón
  const boton = document.createElement("button");
  boton.textContent = "Iniciar Sesión";
  boton.style.marginTop = "15px";
  boton.style.padding = "10px 20px";
  boton.style.border = "none";
  boton.style.borderRadius = "8px";
  boton.style.backgroundColor = "#ffcc00";
  boton.style.cursor = "pointer";
  boton.style.fontWeight = "bold";
  boton.style.transition = "0.2s";

  boton.onmouseover = () => boton.style.backgroundColor = "#ffaa00";
  boton.onmouseout  = () => boton.style.backgroundColor = "#ffcc00";

  boton.onclick = () => {
    window.location.href = "../ContenidoExtra/inicioSesion.html";
  };

  contenido.appendChild(titulo);
  contenido.appendChild(texto);
  contenido.appendChild(boton);
  modal.appendChild(contenido);
  document.body.appendChild(modal);

  // Detener ejecución del juego
  throw new Error("Bloqueado: usuario no autenticado");
}

let indice = 0;
let puntuacion = 0;
let tiempo = 10;
let temporizadorActivo = null;
let preguntaActiva = false;

const btnIniciar = document.getElementById("iniciar");
const contenedorPregunta = document.getElementById("pregunta");
const contenedorOpciones = document.getElementById("opciones");
const contenedorTiempo = document.getElementById("temporizador");
const contenedorResultado = document.getElementById("resultado");
const godleBtn = document.getElementById("godle-btn");

btnIniciar.addEventListener("click", iniciarJuego);
godleBtn.addEventListener("click", () => {
    window.location.href = "../ContenidoExtra/godle.html";
  });

function iniciarJuego() {
  indice = 0;
  puntuacion = 0;
  preguntaActiva = false;
  contenedorResultado.textContent = "";
  btnIniciar.style.display = "none";

  preguntas.sort(() => Math.random() - 0.5);

  mostrarPregunta();
}

function mostrarPregunta() {
  if (indice >= preguntas.length) return finalizarJuego();

  preguntaActiva = true;
  const preguntaActual = preguntas[indice];
  contenedorPregunta.textContent = preguntaActual.texto;
  contenedorOpciones.innerHTML = "";

  preguntaActual.opciones.forEach(opcion => {
    const boton = document.createElement("button");
    boton.textContent = opcion;
    boton.classList.add("opcion");
    boton.onclick = () => verificarRespuesta(opcion);
    contenedorOpciones.appendChild(boton);
  });

  tiempo = 10;
  contenedorTiempo.textContent = `⏳ Tiempo restante: ${tiempo}s`;

  if (temporizadorActivo) clearInterval(temporizadorActivo);
temporizadorActivo = setInterval(() => {
  tiempo--;
  contenedorTiempo.textContent = `⏳ Tiempo restante: ${tiempo}s`;
  if (tiempo <= 0 && preguntaActiva) {
    clearInterval(temporizadorActivo);
    tiempo = 0;
    contenedorTiempo.textContent = `⏳ Tiempo restante: 0s`;
    mostrarRespuestaCorrecta();
  }
}, 1000);

}

function verificarRespuesta(opcionSeleccionada) {
  if (!preguntaActiva) return;
  preguntaActiva = false;
  clearInterval(temporizadorActivo);

  const correcta = preguntas[indice].respuesta;

  if (opcionSeleccionada === correcta) {
    puntuacion++;
    indice++;
    mostrarPregunta();
  } else {
    // si falla, mostrar la correcta y actualizar puntos
    mostrarRespuestaCorrecta();
  }
}

async function mostrarRespuestaCorrecta() {
  const correcta = preguntas[indice].respuesta;
  const botones = contenedorOpciones.querySelectorAll("button");
  botones.forEach(boton => {
    if (boton.textContent === correcta) {
      boton.style.backgroundColor = "green";
      boton.style.color = "white";
    } else {
      boton.style.backgroundColor = "red";
      boton.style.color = "white";
    }
    boton.disabled = true;
  });

  contenedorResultado.textContent = `Fallaste. La respuesta correcta era: "${correcta}"\n🎯 Tu puntuación: ${puntuacion} / ${preguntas.length}`;
  btnIniciar.style.display = "inline-block";

  await actualizarPuntosUsuario();
}

async function finalizarJuego() {
  contenedorPregunta.textContent = "";
  contenedorOpciones.innerHTML = "";
  contenedorTiempo.textContent = "";
  contenedorResultado.textContent = `¡Juego terminado! Tu puntuación: ${puntuacion} / ${preguntas.length}`;
  btnIniciar.style.display = "inline-block";

  await actualizarPuntosUsuario();
}

async function actualizarPuntosUsuario() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario || !usuario.nick) return;

  try {
    // Enviar Puntuacion; Guardar la mayor
    const resPatch = await fetch(`http://localhost:3000/api/usuarios/${usuario.nick}/puntos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puntos: puntuacion })
    });

    if (!resPatch.ok) throw new Error('Error al actualizar puntos');
    const dataPatch = await resPatch.json();

    // Actualiza localStorage con los puntos actuales 
    usuario.puntos = dataPatch.puntosActuales;
    localStorage.setItem('usuario', JSON.stringify(usuario));
    console.log(`Puntos actualizados: ${dataPatch.puntosActuales}`);
  } catch (err) {
    console.error('Error al actualizar puntos:', err);
  }
}

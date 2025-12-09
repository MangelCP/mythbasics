document.addEventListener("DOMContentLoaded", () => {

/***********************************
 *   DETECCIÓN DEL MODO
 ***********************************/
const parametros = new URLSearchParams(window.location.search);
let modoActual = parametros.get("modo") || "practica"; 
let nivel = parametros.get("nivel") || "facil";

/***********************************
 *    BLOQUEO SIN SESION INICIADA
 ***********************************/
const usuarioActual = JSON.parse(localStorage.getItem("usuario"));

if (!usuarioActual || !usuarioActual.nick) {
    mostrarModalSesion();
    return;
}

/***********************************
 *     VARIABLES GLOBALES
 ***********************************/
let personajes = {facil: [], dificil: []};
let personajeObjetivo = null;
let intentados = [];
let errores = 0;

const emojiDiv = document.querySelector("#emojiPista");
const input = document.querySelector("#respuestaInput");
const datalist = document.querySelector("#personajesList");
const submitBtn = document.querySelector("#btnEnviarIcono");
const feedbackDiv = document.querySelector("#mensaje");
const nivelTitulo = document.querySelector("#nivelTitulo");
const btnVolver = document.querySelector("#btnVolverMinijuegos");

/***********************************
 *    MODAL DE SESION
 ***********************************/
function mostrarModalSesion() {
    const modal = document.createElement("div");
    Object.assign(modal.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "9999"
    });

    const contenido = document.createElement("div");
    Object.assign(contenido.style, {
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "15px",
        textAlign: "center",
        maxWidth: "400px",
        width: "90%"
    });

    const mensaje = document.createElement("h2");
    mensaje.textContent = "⚠️ Debes iniciar sesión para acceder al minijuego.";
    mensaje.style.color = "red";

    const btnSesion = document.createElement("button");
    btnSesion.textContent = "Ir a Inicio de Sesión";
    Object.assign(btnSesion.style, {
        marginTop: "20px",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#d8ae22ff",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "bold"
    });
    btnSesion.onclick = () => window.location.href = "../ContenidoExtra/inicioSesion.html";

    contenido.appendChild(mensaje);
    contenido.appendChild(btnSesion);
    modal.appendChild(contenido);
    document.body.appendChild(modal);
}

/***********************************
 *    CARGA DE PERSONAJES
 ***********************************/
async function cargarPersonajes() {
    try {
        const res = await fetch("../EstilosJS/personajesIconos.json");
        if (!res.ok) throw new Error("Error al cargar JSON");
        const data = await res.json();
        personajes.facil = data.facil || [];
        personajes.dificil = [...data.facil || [], ...data.dificil || []];
        personajes.diario = data.diario || [];
        iniciarJuego();
    } catch (error) {
        console.error("Error cargando personajes:", error);
        feedbackDiv.textContent = "No se pudieron cargar los personajes.";
    }
}

/***********************************
 *    ANIMACION DE EMOJIS
 ***********************************/
function animarEmoji() {
    const emojis = emojiDiv.textContent.split(" ");
    emojiDiv.innerHTML = "";

    emojis.forEach((e, i) => {
        const span = document.createElement("span");
        span.textContent = e;
        span.style.display = "inline-block";
        span.style.transform = "translateY(-20px) scale(0.5)";
        span.style.opacity = "0";
        span.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        emojiDiv.appendChild(span);

        setTimeout(() => {
            span.style.transform = "translateY(0) scale(1)";
            span.style.opacity = "1";
        }, i * 100);
    });
}

/***********************************
 *    INICIO DEL JUEGO
 ***********************************/
function iniciarJuego() {
    nivelTitulo.textContent = modoActual === "diario" ? "⭐ Personaje Diario" : `Nivel: ${nivel.toUpperCase()}`;
    elegirPersonaje();
}

function elegirPersonaje() {
    let lista = (modoActual === "diario") ? personajes.dificil : (nivel === "facil" ? personajes.facil : personajes.dificil);

    if (!lista.length) {
        feedbackDiv.textContent = "No hay personajes disponibles para este nivel.";
        return;
    }

    if (modoActual === "diario") {

    const dia = new Date().toDateString();
    const estado = JSON.parse(localStorage.getItem("godle_diario_estado")) || {};

    personajeObjetivo = lista[new Date().getDate() % lista.length];

    // SI YA SE HIZO → bloquear input
    if (estado.fecha === dia && estado.completado) {
    input.disabled = true;
    submitBtn.disabled = true;

    // Mostrar emojis personaje diario
    emojiDiv.textContent = personajeObjetivo.emojis[0];
    animarEmoji();

    // ABRIR EL MODAL AL VOLVER 
    setTimeout(() => {
        mostrarModalPersonaje(personajeObjetivo);
    }, 500);

    return;
}

    // SI NO SE HA COMPLETADO HOY → jugar  (POR SI SALEN Y ENTRAN DE NUEVO, ME HA PASADO)
    input.disabled = false;
    submitBtn.disabled = false;
    feedbackDiv.innerHTML = "<strong>🎯 Adivina el personaje diario:</strong>";
    emojiDiv.textContent = personajeObjetivo.emojis[0];
    animarEmoji();
    return;
}


    // Modo normal/practica
    let disponibles = lista.filter(p => !intentados.includes(normalizarTexto(p.nombre)));
    personajeObjetivo = disponibles[Math.floor(Math.random() * disponibles.length)];

    if (personajeObjetivo) {
        errores = 0;
        emojiDiv.textContent = personajeObjetivo.emojis[0];
        feedbackDiv.textContent = "";
        input.value = "";
        animarEmoji();
    }
}

/***********************************
 *    NORMALIZAR TEXTO (PARA EVITAR PROBLEMAS, ME PASÓ Y DA RABIA JAJAJA)
 ***********************************/
function normalizarTexto(txt) {
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/***********************************
 *    AGREGAR INTENTO
 ***********************************/
function agregarIntento(nombreIngresado) {
    const nombreNorm = normalizarTexto(nombreIngresado);
    const lista = nivel === "facil" ? personajes.facil : personajes.dificil;

    const personaje = lista.find(p => normalizarTexto(p.nombre) === nombreNorm);

    if (!personaje) {
        feedbackDiv.style.color = "red";
        feedbackDiv.textContent = `El personaje "${nombreIngresado}" no está en la lista.`;
        input.value = "";
        return;
    }

    if (intentados.includes(nombreNorm)) {
        feedbackDiv.style.color = "red";
        feedbackDiv.textContent = `Ya intentaste ${personaje.nombre}.`;
        input.value = "";
        return;
    }

    intentados.push(nombreNorm);

    if (nombreNorm === normalizarTexto(personajeObjetivo.nombre)) {
        feedbackDiv.style.color = "green";
        feedbackDiv.textContent = `¡Correcto! Era ${personajeObjetivo.nombre} ✨`;
        if (modoActual === "diario") {
            localStorage.setItem("godle_diario_estado", JSON.stringify({ fecha: new Date().toDateString(), completado: true }));
        }
        mostrarModalPersonaje(personajeObjetivo);
    } else {
        feedbackDiv.style.color = "red";
        feedbackDiv.textContent = "Incorrecto, prueba otra vez";

        if (errores < personajeObjetivo.emojis.length - 1) {
            errores++;
            emojiDiv.textContent = personajeObjetivo.emojis.slice(0, errores + 1).join(" ");
            animarEmoji();
        }
    }

    input.value = "";
}

/***********************************
 *    MODAL DE PERSONAJE
 ***********************************/
function mostrarModalPersonaje(personaje) {
    const modal = document.createElement("div");
    Object.assign(modal.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "9999"
    });

    // Evitar que se cierre con clic fuera
    modal.addEventListener("click", e => e.stopPropagation());

    const contenido = document.createElement("div");
    Object.assign(contenido.style, {
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "15px",
        textAlign: "center",
        maxWidth: "400px",
        width: "90%",
        boxShadow: "0 5px 20px rgba(0,0,0,0.4)"
    });

    const titulo = document.createElement("h2");

    if (modoActual === "diario") {
        titulo.textContent = `Ya adivinaste al personaje del día. Es: ${personaje.nombre}`;
    } else {
        titulo.textContent = `¡EL PERSONAJE ES ${personaje.nombre.toUpperCase()}!`;
    }

    titulo.style.color = "#d8ae22ff";
    titulo.style.fontWeight = "bold";


    const emojis = document.createElement("p");
    emojis.textContent = personaje.emojis.join(" ");
    emojis.style.fontSize = "3rem";
    emojis.style.margin = "10px 0";
    emojis.style.opacity = "0";
    emojis.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    emojis.style.transform = "scale(0.5)";

    setTimeout(() => {
        emojis.style.opacity = "1";
        emojis.style.transform = "scale(1)";
    }, 50);

    // Botón para volver en diario
    const btnVolver = document.createElement("button");
    btnVolver.textContent = "Volver a Minijuegos";
    Object.assign(btnVolver.style, {
        marginTop: "15px",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#d8ae22ff",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "bold"
    });
    btnVolver.onclick = () => window.location.href = "../ContenidoExtra/minijuegos.html";

    contenido.appendChild(titulo);
    contenido.appendChild(emojis);
    contenido.appendChild(btnVolver);

    // En modo practica → boton volver a jugar
    if (modoActual !== "diario") {
        const btnReiniciar = document.createElement("button");
        btnReiniciar.textContent = "Volver a Jugar";
        Object.assign(btnReiniciar.style, {
            marginTop: "10px",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#ffcc00",
            cursor: "pointer",
            fontWeight: "bold"
        });
        btnReiniciar.onclick = () => {
            modal.remove();
            iniciarJuego();
        };
        contenido.appendChild(btnReiniciar);
    }

    modal.appendChild(contenido);
    document.body.appendChild(modal);

    // BLOQUEAR INPUT Y BOTON MODO DIARIO
    if (modoActual === "diario") {
        input.disabled = true;
        submitBtn.disabled = true;
    }
}


/***********************************
 *    AUTOCOMPLETADO
 ***********************************/
input.addEventListener("input", () => {
    const texto = input.value.toLowerCase();
    datalist.innerHTML = "";

    if (!texto) return;

    const lista = nivel === "facil" ? personajes.facil : personajes.dificil;
    lista
        .filter(p => p.nombre.toLowerCase().startsWith(texto) && !intentados.includes(normalizarTexto(p.nombre)))
        .forEach(p => {
            const option = document.createElement("option");
            option.value = p.nombre;
            datalist.appendChild(option);
        });
});

/***********************************
 *    EVENTOS BOTONES
 ***********************************/
submitBtn.addEventListener("click", () => {
    const nombre = input.value.trim();
    if (!nombre) return;
    agregarIntento(nombre);
    datalist.innerHTML = "";
});

input.addEventListener("keypress", e => {
    if (e.key === "Enter") submitBtn.click();
});

btnVolver.addEventListener("click", () => {
    window.location.href = "../ContenidoExtra/minijuegos.html";
});

/***********************************
 *    INICIAR CARGA
 ***********************************/
cargarPersonajes();

});

document.addEventListener("DOMContentLoaded", () => {

/***********************************
 *   DETECCIÓN DEL MODO
 ***********************************/
const parametros = new URLSearchParams(window.location.search);
let modoActual = parametros.get("modo") || "practica"; // práctica o diario

/***********************************
 *    BLOQUEO SIN SESIÓN INICIADA
 ***********************************/
const usuarioActual = JSON.parse(localStorage.getItem("usuario"));

if (!usuarioActual || !usuarioActual.nick) {
    const modal = document.createElement("div");
    modal.id = "modalInicioSesion";
    Object.assign(modal.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "99999"
    });

    const contenido = document.createElement("div");
    Object.assign(contenido.style, {
        background: "#fff",
        padding: "25px",
        width: "330px",
        borderRadius: "12px",
        textAlign: "center",
        boxShadow: "0 5px 15px rgba(0,0,0,0.25)",
        animation: "modalAppear 0.3s ease"
    });

    const titulo = document.createElement("h2");
    titulo.textContent = "Acceso restringido";

    const texto = document.createElement("p");
    texto.textContent = "Debes iniciar sesión para acceder al minijuego.";

    const boton = document.createElement("button");
    boton.textContent = "Iniciar Sesión";
    Object.assign(boton.style, {
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#ffcc00",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "0.25s"
    });
    boton.onmouseover = () => boton.style.transform = "scale(1.06)";
    boton.onmouseout = () => boton.style.transform = "scale(1)";
    boton.onclick = () => {
        modal.style.opacity = "0";
        modal.style.transition = "opacity .25s";
        setTimeout(() => {
            window.location.href = "../ContenidoExtra/inicioSesion.html";
        }, 250);
    };

    contenido.appendChild(titulo);
    contenido.appendChild(texto);
    contenido.appendChild(boton);
    modal.appendChild(contenido);
    document.body.appendChild(modal);

    throw new Error("Bloqueado: usuario no autenticado");
}

/***********************************
 *     VARIABLES GLOBALES
 ***********************************/
let personajes = [];
let personajeObjetivo = null;
let intentados = [];

const tablaBody = document.querySelector("#tabla-godle tbody");
const feedbackDiv = document.querySelector("#feedback");
const input = document.querySelector("#respuesta-input");
const datalist = document.querySelector("#personajes-list");
const submitBtn = document.querySelector("#submit-btn");
const reiniciarBtn = document.createElement("button");
const volverBtn = document.createElement("button");

/***********************************
 *    CARGA DE PERSONAJES DESDE JSON
 ***********************************/
async function cargarPersonajes() {
    try {
        const res = await fetch("../EstilosJS/personajes.json");
        if (!res.ok) throw new Error("Error al cargar JSON");
        personajes = await res.json();
        iniciarJuego();
    } catch (error) {
        console.error("Error cargando personajes:", error);
        feedbackDiv.textContent = "No se pudieron cargar los personajes.";
    }
}

/***********************************
 *   MODO DIARIO — RANDOM
 ***********************************/
function getDailyRandomIndex(max) {
    const fecha = new Date();
    const seed = fecha.getFullYear() * 10000 + (fecha.getMonth() + 1) * 100 + fecha.getDate();
    let x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
}

function obtenerPersonajeDiario() {
    return personajes[getDailyRandomIndex(personajes.length)];
}

function getEstadoDiario() {
    return JSON.parse(localStorage.getItem("godle_diario_estado")) || {};
}

function setEstadoDiario(data) {
    localStorage.setItem("godle_diario_estado", JSON.stringify(data));
}

/***********************************
 *    INICIO DEL JUEGO
 ***********************************/
function iniciarJuego() {
    if (modoActual === "practica") {
        personajeObjetivo = personajes[Math.floor(Math.random() * personajes.length)];
    }

    if (modoActual === "diario") {
        personajeObjetivo = obtenerPersonajeDiario();
        const hoy = new Date().toDateString();
        const estado = getEstadoDiario();

        // Si ya se completo hoy
        if (estado.fecha === hoy && estado.completado) {
            feedbackDiv.innerHTML = `<strong>🎉 Ya adivinaste al personaje del día.</strong>`;
            submitBtn.disabled = true;
            input.disabled = true;

            // Mostrar personaje diario en tabla
            agregarFilaResultadoDiario(personajeObjetivo);

            // Lanzar modal
            setTimeout(() => {
                mostrarModalPersonaje(personajeObjetivo);
            }, 500);

            return;
        }
    }
}

function agregarFilaResultadoDiario(personaje) {
    const tr = document.createElement("tr");
    const columnas = ["nombre", "divinidad", "genero", "mitologia", "labor", "casado"];

    columnas.forEach(col => {
        const td = document.createElement("td");
        td.textContent = personaje[col];
        td.className = "correcto"; // acierto 
        tr.appendChild(td);
    });

    tablaBody.appendChild(tr);
}


/***********************************
 *   FUNCION MODAL PERSONAJE ACERTADO
 ***********************************/
function mostrarModalPersonaje(personaje) {
    const modalFondo = document.createElement("div");
    Object.assign(modalFondo.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "99999"
    });

    // Evitar cerrar modal con clic fuera
    modalFondo.addEventListener("click", e => e.stopPropagation());

    const modalContenido = document.createElement("div");
    Object.assign(modalContenido.style, {
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "15px",
        textAlign: "center",
        maxWidth: "400px",
        width: "90%",
        boxShadow: "0 5px 20px rgba(0,0,0,0.4)",
        animation: "modalAppear 0.4s ease"
    });

    const titulo = document.createElement("h2");

    if (modoActual === "diario") {
        titulo.textContent = `Ya adivinaste al personaje del día, es: ${personaje.nombre}`;
    } else {
        titulo.textContent = `¡EL PERSONAJE ES ${personaje.nombre.toUpperCase()}!`;
    }

    titulo.style.color = "#d8ae22ff";
    modalContenido.appendChild(titulo);

    // BOTÓN REINICIAR (modo practica)
    if (modoActual === "practica") {
        const reiniciarBtn = document.createElement("button"); 
        reiniciarBtn.textContent = "Reiniciar Juego";
        Object.assign(reiniciarBtn.style, {
            marginTop: "15px",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#ffcc00",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer"
        });
        reiniciarBtn.onclick = () => {
            intentados = [];
            tablaBody.innerHTML = "";
            feedbackDiv.textContent = "";
            input.value = "";
            submitBtn.disabled = false;
            input.disabled = false;
            personajeObjetivo = personajes[Math.floor(Math.random() * personajes.length)];
            modalFondo.remove();
        };
        modalContenido.appendChild(reiniciarBtn);
    }

    // BOTÓN VOLVER A MINIJUEGOS
    const volverBtn = document.createElement("button"); 
    volverBtn.textContent = "Volver a Minijuegos";
    Object.assign(volverBtn.style, {
        marginTop: "15px",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#d8ae22ff",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer"
    });
    volverBtn.onclick = () => {
        window.location.href = "../ContenidoExtra/minijuegos.html";
    };
    modalContenido.appendChild(volverBtn);

    modalFondo.appendChild(modalContenido);
    document.body.appendChild(modalFondo);
}

/***********************************
 *     LÓGICA DEL JUEGO
 ***********************************/
function normalizarTexto(txt) {
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function agregarIntento(nombreIngresado) {
    const nombreNorm = normalizarTexto(nombreIngresado);

    if (intentados.includes(nombreNorm)) {
        feedbackDiv.textContent = `Ya intentaste ${nombreIngresado}.`;
        return;
    }

    const personaje = personajes.find(p => normalizarTexto(p.nombre) === nombreNorm);
    if (!personaje) {
        feedbackDiv.textContent = `El personaje "${nombreIngresado}" no está en la lista.`;
        return;
    }

    intentados.push(nombreNorm);

    const tr = document.createElement("tr");
    const columnas = ["nombre", "divinidad", "genero", "mitologia", "labor", "casado"];

    columnas.forEach((col, i) => {
        const td = document.createElement("td");
        td.textContent = personaje[col];
        td.style.opacity = 0;
        tr.appendChild(td);

        setTimeout(() => {
            td.style.transition = "opacity 0.4s";
            td.style.opacity = 1;

            if (i === 0) {
                td.style.backgroundColor = "#d8ae22ff";
                return;
            }

            td.className = nombreNorm === normalizarTexto(personajeObjetivo.nombre)
                ? "correcto"
                : personaje[col] === personajeObjetivo[col]
                ? "correcto"
                : "incorrecto";
        }, i * 400);
    });

    tablaBody.appendChild(tr);

    // Tiempo Animacion tabla (6 columnas × 400ms = 2400ms)
setTimeout(() => {
    
    // Correcto
    if (nombreNorm === normalizarTexto(personajeObjetivo.nombre)) {

        if (modoActual === "diario") {
            feedbackDiv.textContent = `¡Ya adivinaste al personaje del día! Era: ${personajeObjetivo.nombre}.`;
            setEstadoDiario({ fecha: new Date().toDateString(), completado: true });
        } else {
            feedbackDiv.textContent = `¡Correcto! Era ${personajeObjetivo.nombre}.`;
        }

        submitBtn.disabled = true;
        input.disabled = true;

        mostrarModalPersonaje(personajeObjetivo);

    } 
    // Incorrecto
    else {
        feedbackDiv.textContent = "¡Sigue intentando!";
    }

}, 2400);

}

/***********************************
 *      AUTOCOMPLETADO
 ***********************************/
input.addEventListener("input", () => {
    const texto = input.value.toLowerCase();
    datalist.innerHTML = "";

    if (!texto) return;

    personajes
        .filter(p => p.nombre.toLowerCase().startsWith(texto) && !intentados.includes(normalizarTexto(p.nombre)))
        .forEach(p => {
            const option = document.createElement("option");
            option.value = p.nombre;
            datalist.appendChild(option);
        });
});

/***********************************
 *      EVENTOS DE BOTONES
 ***********************************/
submitBtn.addEventListener("click", () => {
    const nombre = input.value.trim();
    if (!nombre) return;
    agregarIntento(nombre);
    input.value = "";
    datalist.innerHTML = "";
});

input.addEventListener("keypress", e => {
    if (e.key === "Enter") submitBtn.click();
});

/***********************************
 *      INICIAR CARGA
 ***********************************/
cargarPersonajes();

});

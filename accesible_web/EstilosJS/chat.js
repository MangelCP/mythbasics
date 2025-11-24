document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  // ================= MODAL EDITAR/BORRAR =====================
  const modal = document.createElement("div");
  modal.className = "modal-editar";
  modal.style.display = "none"; // oculto al inicio
  modal.innerHTML = `<div class="modal-contenido"></div>`;
  document.body.appendChild(modal);

  const abrirModal = (contenidoHTML, callbackAceptar = null, callbackCancelar = null) => {
    const contenido = modal.querySelector(".modal-contenido");
    contenido.innerHTML = contenidoHTML;

    const btnAceptar = contenido.querySelector(".btn-aceptar");
    const btnCancelar = contenido.querySelector(".btn-cancelar");

    if (btnAceptar) btnAceptar.onclick = () => {
      modal.style.display = "none";
      if (callbackAceptar) callbackAceptar();
    };
    if (btnCancelar) btnCancelar.onclick = () => {
      modal.style.display = "none";
      if (callbackCancelar) callbackCancelar();
    };

    modal.style.display = "flex";

    // Evitar sobrescribir otros eventos
    const cerrarClickFuera = e => {
      if (e.target === modal) {
        modal.style.display = "none";
        if (callbackCancelar) callbackCancelar();
        window.removeEventListener("click", cerrarClickFuera);
      }
    };
    window.addEventListener("click", cerrarClickFuera);
  };
  // ==========================================================

  // ================= VERIFICAR USUARIO =====================
  if (!usuario || !usuario.nick) {
    alert("⚠️ Debes iniciar sesión para usar el chat.");
    window.location.href = "../ContenidoExtra/inicioSesion.html";
    return;
  }

  // ================= MODAL NORMAS ==========================
  const modalNormas = document.getElementById("modalNormas");
  const btnAceptarNormas = document.getElementById("btnAceptarNormas");
  const btnRegresarNormas = document.getElementById("btnRegresarNormas");
  const inputContainer = document.querySelector(".input-container");

  if (modalNormas && btnAceptarNormas && btnRegresarNormas && inputContainer) {
    inputContainer.classList.add("bloqueado");
    modalNormas.style.display = "flex"; // Mostrar modal al cargar

    btnAceptarNormas.addEventListener("click", () => {
      modalNormas.style.display = "none";
      inputContainer.classList.remove("bloqueado");
    });

    btnRegresarNormas.addEventListener("click", () => {
      window.history.back();
    });
  }

  // ================= CHAT ================================
  const mensajesDiv = document.getElementById("mensajes");
  const inputMensaje = document.getElementById("inputMensaje");
  const btnEnviar = document.getElementById("btnEnviar");
  const btnVolver = document.getElementById("btnVolver");

  let mensajes = [];
  let primeraCarga = true; // scroll al final en la primera carga

  const formatearHora = timestamp => {
    if (!timestamp) return "--:--";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "--:--";
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const renderMensajes = () => {
    if (!mensajesDiv) return;

    const scrollAnterior = mensajesDiv.scrollTop;
    const alturaAnterior = mensajesDiv.scrollHeight;

    mensajesDiv.innerHTML = "";

    mensajes.forEach(msg => {
      const soyDuenio = msg.nick === usuario.nick;
      const soyAdmin = usuario.rango === "administrador";

      const div = document.createElement("div");
      div.className = soyDuenio ? "mensaje mine" : "mensaje other";

      div.innerHTML = `
        <img src="${msg.foto && msg.foto.trim() !== '' ? msg.foto : '../imagenes/imagenesPerfiles/perfilDefecto.jpg'}" alt="foto">
        <div class="burbuja">
          <div class="nombre">
            ${msg.nombre} 
            <span class="hora">${formatearHora(msg.fecha)}</span>
          </div>
          <div class="texto" id="msg-${msg.id}">${msg.texto}</div>

          ${(soyDuenio || soyAdmin) ? `
            <div class="acciones">
              <button class="editar" data-id="${msg.id}" data-texto="${msg.texto}">✏</button>
              <button class="borrar" data-id="${msg.id}">🗑</button>
            </div>
          ` : ""}
        </div>
      `;
      mensajesDiv.appendChild(div);
    });

    const alturaNueva = mensajesDiv.scrollHeight;
    if (primeraCarga || scrollAnterior + 50 >= alturaAnterior) {
      // Primera carga o estaba al final: scroll abajo
      mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
      primeraCarga = false;
    } else {
      // Mantener scroll donde estaba
      mensajesDiv.scrollTop = scrollAnterior;
    }
  };

  // ======= EDITAR / BORRAR CON MODAL =======
  if (mensajesDiv) {
    mensajesDiv.addEventListener("click", e => {
      const id = e.target.dataset.id;

      if (e.target.classList.contains("editar")) {
        const textoActual = e.target.dataset.texto;
        abrirModal(`
          <p>Editar mensaje:</p>
          <input type="text" value="${textoActual}" style="width:100%" id="inputEditar">
          <button class="btn-aceptar">Aceptar</button>
          <button class="btn-cancelar">Cancelar</button>
        `, () => {
          const nuevoTexto = document.getElementById("inputEditar").value.trim();
          if (!nuevoTexto) return;
          fetch(`http://localhost:3000/api/chat/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nick: usuario.nick, texto: nuevoTexto })
          })
          .then(res => res.json())
          .then(() => cargarMensajes());
        });
      }

      if (e.target.classList.contains("borrar")) {
        abrirModal(`
          <p>¿Seguro que deseas borrar este mensaje?</p>
          <button class="btn-aceptar">Sí, borrar</button>
          <button class="btn-cancelar">Cancelar</button>
        `, () => {
          fetch(`http://localhost:3000/api/chat/${id}?nick=${usuario.nick}`, { method: "DELETE" })
            .then(res => res.json())
            .then(() => cargarMensajes());
        });
      }
    });
  }

  // ======= CARGAR MENSAJES =======
  const cargarMensajes = () => {
    fetch('http://localhost:3000/api/chat')
      .then(res => res.json())
      .then(data => {
        mensajes = data;
        renderMensajes();
      })
      .catch(err => console.error("Error cargando mensajes:", err));
  };

  // ======= ENVIAR MENSAJE =======
  const enviar = () => {
    if (!inputMensaje) return;
    const texto = inputMensaje.value.trim();
    if (!texto) return;

    inputMensaje.value = "";

    const nuevoMensaje = {
      nick: usuario.nick,
      nombre: usuario.nombre || usuario.nick,
      foto: usuario.foto && usuario.foto.trim() !== "" 
            ? usuario.foto 
            : "/imagenes/imagenesPerfiles/perfilDefecto.jpg",
      texto
    };

    fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoMensaje)
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) cargarMensajes();
        else console.error("Error al enviar mensaje:", data.error);
      })
      .catch(err => console.error("Error enviando mensaje:", err));
  };

  if (btnEnviar) btnEnviar.addEventListener("click", enviar);
  if (inputMensaje) inputMensaje.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      enviar();
    }
  });

  if (btnVolver) btnVolver.addEventListener("click", () => {
    window.history.back();
  });

  cargarMensajes();
  setInterval(cargarMensajes, 2000);
});

document.addEventListener("DOMContentLoaded", () => {
  // ================= MODAL GLOBAL =====================
  const modal = document.createElement("div");
  modal.className = "modal-editar";
  modal.style.display = "none"; // oculto por defecto
  modal.innerHTML = `
    <div class="modal-contenido">
      <img id="modalImagen" src="" alt="" style="max-width:100%; border-radius:8px; margin-bottom:10px; display:none;">
      <p id="modalTexto"></p>
      <input type="text" id="modalInput" style="display:none; width:90%; padding:5px; margin-top:10px;">
      <div id="modalBotones" style="margin-top:10px;">
        <button id="modalBtnAceptar" style="display:none;">Aceptar</button>
        <button id="modalBtnEnviar" style="display:none;">Enviar</button>
        <button id="modalBtnCancelar" style="display:none;">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Elementos del modal
  const modalTexto = document.getElementById("modalTexto");
  const modalImagen = document.getElementById("modalImagen");
  const modalInput = document.getElementById("modalInput");
  const btnAceptar = document.getElementById("modalBtnAceptar");
  const btnEnviar = document.getElementById("modalBtnEnviar");
  const btnCancelar = document.getElementById("modalBtnCancelar");

  // Helper para resetear botones/inputs del modal
  function resetModalUI() {
    modalImagen.style.display = "none";
    modalImagen.src = "";
    modalInput.style.display = "none";
    modalInput.value = "";
    btnAceptar.style.display = "none";
    btnEnviar.style.display = "none";
    btnCancelar.style.display = "none";

    // quitar handlers antiguos (evitar acumulación)
    btnAceptar.onclick = null;
    btnEnviar.onclick = null;
    btnCancelar.onclick = null;
  }

  // Mostrar modal genérico (texto simple). Por defecto muestra Aceptar.
function mostrarModal(texto, imagen = null, { showAceptar = true } = {}) {
  resetModalUI();
  modalTexto.textContent = texto;
  if (imagen) {
    modalImagen.src = imagen;
    modalImagen.style.display = "block";
  }
  if (showAceptar) {
    btnAceptar.style.display = "inline-block";
    // Sobrescribimos el onclick SOLO para este modal
    btnAceptar.onclick = () => {
      modal.style.display = "none";
      // Restauramos el onclick global después
      btnAceptar.onclick = () => { modal.style.display = "none"; };
    };
  }
  modal.style.display = "flex";
}


  // Modal tipo acertijo (input + enviar + cancelar)
  function mostrarAcertijo(pregunta, correcta, imagen = null) {
    resetModalUI();
    modalTexto.textContent = pregunta;
    if (imagen) {
      modalImagen.src = imagen;
      modalImagen.style.display = "block";
    }
    modalInput.value = "";
    modalInput.style.display = "block";

    btnEnviar.style.display = "inline-block";
    btnCancelar.style.display = "inline-block";

    // Handler enviar respuesta
    btnEnviar.onclick = () => {
      const respuesta = modalInput.value.trim().toLowerCase();
      if (!respuesta) return;
      if (respuesta === String(correcta).toLowerCase()) {
        // Respuesta correcta: mostramos mensaje de éxito con Aceptar
        mostrarModal("¡Respuesta correcta!", imagen, { showAceptar: true });
        // btnAceptar cerrará por defecto el modal (se define abajo)
        btnAceptar.onclick = () => { modal.style.display = "none"; };
      } else {
        // Mostrar opciones para reintentar o cancelar
        resetModalUI();
        modalTexto.textContent = "Respuesta incorrecta. ¿Quieres intentar de nuevo?";
        btnAceptar.style.display = "inline-block"; // "Intentar de nuevo"
        btnCancelar.style.display = "inline-block";

        // Reintentar
        btnAceptar.onclick = () => mostrarAcertijo(pregunta, correcta, imagen);
        btnCancelar.onclick = () => { modal.style.display = "none"; };
      }
    };

    // Handler cancelar
    btnCancelar.onclick = () => { modal.style.display = "none"; };

    modal.style.display = "flex";
  }

  // Por defecto Aceptar cierra el modal (comportamiento general)
  btnAceptar.onclick = () => { modal.style.display = "none"; };

  // Cerrar modal si clicas fuera del contenido
  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  // ================= CURIOSIDADES =====================
  const curiosidades = [
    { id: "sol1", texto: "Curiosidad 1: En el culto de Sobek, se momificaban cocodrilos, llegando a considerarse que estas momias los protegian incluso tras la muerte.", imagen: "../imagenes/ImagenesInicioEgypt/momia.jpg" },
    { id: "sol2", texto: "Curiosidad 2: Ra intentó acabar con los humanos que empezaron a adorar a la serpiente Apofis, enviando a Sekmet a matarlos.", imagen: "../imagenes/ImagenesInicioEgypt/apofis.jpg"  },
    { id: "sol3", texto: "Curiosidad 3: Cuando Zeus, Poseidon y Hades se dividieron el mundo, los 3 tambien son propietarios del Olimpo, no solo Zeus.", imagen: "../imagenes/ImagenesInicioGreek/eleccionReinos.JPG"  },
    { id: "sol4", texto: "Curiosidad 4: Varios humanos que han sido divinizados, viviendo ahora en el Olimpo como dioses, siendo el caso de Ariadna, Heracles o Psique.", imagen: "../imagenes/ImagenesInicioGreek/ariadna.jpg"  }
  ];

  curiosidades.forEach(c => {
    const elem = document.getElementById(c.id);
    if (elem) elem.addEventListener("click", () => mostrarModal(c.texto, c.imagen));
  });

  // ================= ACERTIJOS ========================
  const acertijos = [
    {
      id: "esfingue",
      pregunta: "¿Cuál es la criatura que en la mañana camina en cuatro patas, al mediodía en dos y en la noche en tres?",
      correcta: "hombre",
      imagen: "../imagenes/ImagenesInicioEgypt/relato.jpg"
    },
    {
      id: "olimpo",
      pregunta: "¿A quién pertenece esta profecía: 'Matarás a tu propio padre, te casarás con tu madre, y dejarás un vástago vergonzoso'?",
      correcta: "edipo",
      imagen: "../imagenes/ImagenesInicioGreek/edipo.jpg"
    }
  ];

  acertijos.forEach(a => {
    const elem = document.getElementById(a.id);
    if (elem) elem.addEventListener("click", () => mostrarAcertijo(a.pregunta, a.correcta, a.imagen));
  });

// ================= LOGIN =====================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('password').value;

    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena })
    })
      .then(res => {
        if (!res.ok) throw new Error('Usuario o contraseña incorrectos');
        return res.json();
      })
      .then(data => {
        // Guardar usuario
        localStorage.setItem('usuario', JSON.stringify(data.usuario));

        // Mostrar modal de bienvenida
        resetModalUI();
        modalTexto.textContent = `${data.mensaje}\nBienvenido ${data.usuario.nombre}`;
        btnAceptar.style.display = "inline-block";
        btnAceptar.onclick = () => {
          modal.style.display = "none";
          window.location.href = '../PaginaPrincipal/index.html';
        };
        modal.style.display = "flex";
      })
      .catch(err => {
        document.getElementById('usuario').value = '';
        document.getElementById('password').value = '';
        // Mostrar modal de error y cerrar solo el modal al aceptar
        resetModalUI();
        modalTexto.textContent = err.message;
        btnAceptar.style.display = "inline-block";
        btnAceptar.onclick = () => {
          modal.style.display = "none"; // Cierra la ventana modal
        };
        modal.style.display = "flex";
      });
  });
}


  // ================= BOTÓN DE SESIÓN =====================
  const botonSesion = document.getElementById('BotonSesion');
  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  if (botonSesion && usuarioGuardado && usuarioGuardado.nombre) {
    botonSesion.textContent = `Hola ${usuarioGuardado.nombre}`;
    botonSesion.removeAttribute('onclick');
    botonSesion.addEventListener('click', () => window.location.href = '../ContenidoExtra/perfil.html');
  }

    // Mostrar/ocultar tarjeta Adaptaciones según sesión
    const cardAdaptaciones = document.getElementById('cardAdaptaciones');
      const mensajeLogin = document.getElementById('mensajeLogin');

      if (cardAdaptaciones) {
        if (usuarioGuardado && usuarioGuardado.nombre) {
          cardAdaptaciones.style.display = 'block';
          mensajeLogin.style.display = 'none';
        } else {
          cardAdaptaciones.style.display = 'none';
          mensajeLogin.style.display = 'block';
        }
      }

  // ================= BLOQUEO MINIJUEGOS =====================
  const linkMinijuegos = document.getElementById('linkMinijuegos');
  if (linkMinijuegos && !usuarioGuardado) {
    linkMinijuegos.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarModal('⚠️ Debes iniciar sesión para acceder a los minijuegos.');
      setTimeout(() => window.location.href = '../ContenidoExtra/inicioSesion.html', 1500);
    });
  }

  // ================= SECCIÓN CHAT =====================
  const opcionChat = document.getElementById("opcionChat");
  if (opcionChat) {
    if (usuarioGuardado && (usuarioGuardado.rango === "premium" || usuarioGuardado.rango === "administrador")) {
      opcionChat.style.display = "block";
    } else {
      opcionChat.style.display = "none";
    }
  }

  
});

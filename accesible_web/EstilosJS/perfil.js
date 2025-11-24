document.addEventListener("DOMContentLoaded", () => {
  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

  // ================= MODAL GLOBAL =====================
  const modal = document.createElement("div");
  modal.className = "modal-editar";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-contenido">
      <p id="modalTexto"></p>
      <div id="modalBotones" style="margin-top:10px;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const modalTexto = document.getElementById("modalTexto");
  const modalBotones = document.getElementById("modalBotones");

  // Modal tipo confirm (se mantiene para otros usos)
  function mostrarConfirm(texto, callbackAceptar, callbackCancelar) {
    modalTexto.textContent = texto;
    modalBotones.innerHTML = `
      <button id="modalBtnAceptar">Aceptar</button>
      <button id="modalBtnCancelar">Cancelar</button>
    `;
    const btnAceptar = document.getElementById("modalBtnAceptar");
    const btnCancelar = document.getElementById("modalBtnCancelar");
    modal.style.display = "flex";
    btnAceptar.onclick = () => {
      modal.style.display = "none";
      if (callbackAceptar) callbackAceptar();
    };
    btnCancelar.onclick = () => {
      modal.style.display = "none";
      if (callbackCancelar) callbackCancelar();
    };
  }

 if (!usuarioGuardado) {
  // Mostrar modal
  modalTexto.textContent = "⚠️ No hay sesión iniciada. Haga click fuera de la ventana para iniciar sesión.";
  modal.style.display = "flex";

  // Al hacer clic fuera del modal → redirigir
  modal.onclick = () => {
    window.location.href = "inicioSesion.html";
  };

  // Evitar que clic dentro del contenido cierre el modal
  document.querySelector(".modal-contenido").onclick = (e) => e.stopPropagation();

  // Detener ejecución del resto del script
  return;
}


  const fotoPerfil = document.getElementById("imagenPerfil");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const rangoUsuario = document.getElementById("rangoUsuario");
  const inputFoto = document.getElementById("inputFoto");
  const btnCambiarFoto = document.getElementById("btnCambiarFoto");
  const btnPremium = document.getElementById("btnPremium");

  // Mostrar botón solo si el usuario NO es premium o admin
  if (usuarioGuardado.rango === "usuario") {
    btnPremium.style.display = "block";
  }

  btnPremium.addEventListener("click", () => {
    mostrarConfirm(
      "¿Deseas convertirte en usuario Premium por 0€? ⭐",
      () => {
        fetch(`http://localhost:3000/api/usuarios/${usuarioGuardado.nick}/premium`, {
          method: 'PATCH',
          headers: { "Content-Type": "application/json" }
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              modalTexto.textContent = "⛔ " + data.error;
              modal.style.display = "flex";
              return;
            }

            usuarioGuardado.rango = data.rango;
            localStorage.setItem("usuario", JSON.stringify(usuarioGuardado));

            rangoUsuario.textContent = "Rango: premium";
            btnPremium.style.display = "none";

            modalTexto.textContent = "✨ ¡Ahora eres Premium! Disfruta de las nuevas funciones.";
            modalBotones.innerHTML = `<button id="modalBtnAceptar">Aceptar</button>`;
            modal.style.display = "flex";
            document.getElementById("modalBtnAceptar").onclick = () => window.location.reload();
          })
          .catch(err => {
            console.error("Error:", err);
            modalTexto.textContent = "Ocurrió un error al cambiar el rango.";
            modalBotones.innerHTML = `<button id="modalBtnAceptar">Aceptar</button>`;
            modal.style.display = "flex";
            document.getElementById("modalBtnAceptar").onclick = () => modal.style.display = "none";
          });
      }
    );
  });

  // --- APLICAR NOMBRE Y RANGO ---
  nombreUsuario.textContent = 'Nick: ' + usuarioGuardado.nick;
  nombre.textContent = 'Nombre: ' + usuarioGuardado.nombre;
  rangoUsuario.textContent = `Rango: ${usuarioGuardado.rango}`;

  // --- Mostrar botón Tickets si es administrador ---
  const btnTickets = document.getElementById("btnTickets");
  if (usuarioGuardado.rango === "administrador") {
    btnTickets.style.display = "inline-block";
    btnTickets.addEventListener("click", () => {
      window.location.href = "vistaSugerencias.html";
    });
  }

  // --- SI NO TENEMOS FOTO GUARDADA EN LOCALSTORAGE ---
  if (!usuarioGuardado.foto) {
    fetch(`http://localhost:3000/api/usuarios/${usuarioGuardado.nick}`)
      .then(res => res.json())
      .then(data => {
        usuarioGuardado.foto = data.foto || null;
        localStorage.setItem("usuario", JSON.stringify(usuarioGuardado));
        fotoPerfil.src = usuarioGuardado.foto || "../imagenes/imagenesPerfiles/perfilDefecto.jpg";
      });
  } else {
    fotoPerfil.src = usuarioGuardado.foto;
  }

  // --- CAMBIAR FOTO ---
  btnCambiarFoto.addEventListener("click", () => inputFoto.click());

  inputFoto.addEventListener("change", () => {
    const archivo = inputFoto.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => {
      const fotoBase64 = lector.result;

      fetch(`http://localhost:3000/api/usuarios/${usuarioGuardado.nick}/foto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: fotoBase64 })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            fotoPerfil.src = data.foto;
            usuarioGuardado.foto = data.foto;
            localStorage.setItem("usuario", JSON.stringify(usuarioGuardado));
          } else {
            modalTexto.textContent = "Error al subir la imagen";
            modalBotones.innerHTML = `<button id="modalBtnAceptar">Aceptar</button>`;
            modal.style.display = "flex";
            document.getElementById("modalBtnAceptar").onclick = () => modal.style.display = "none";
          }
        })
        .catch(err => {
          console.error("Error al subir la imagen:", err);
          modalTexto.textContent = "Error al subir la imagen";
          modalBotones.innerHTML = `<button id="modalBtnAceptar">Aceptar</button>`;
          modal.style.display = "flex";
          document.getElementById("modalBtnAceptar").onclick = () => modal.style.display = "none";
        });
    };
    lector.readAsDataURL(archivo);
  });

  // --- CERRAR SESIÓN ---
  document.getElementById("btnCerrarSesion").addEventListener("click", () => {
    mostrarConfirm(
      "¿Seguro que deseas cerrar sesión?",
      () => {
        localStorage.removeItem("usuario");
        window.location.href = "inicioSesion.html";
      }
    );
  });

  // --- VOLVER ---
  document.getElementById("btnVolver").addEventListener("click", () => {
    window.location.href = "../PaginaPrincipal/index.html";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioGuardado) {
    mostrarModal("⚠️ No hay sesión iniciada.");
    setTimeout(() => window.location.href = "../ContenidoExtra/inicioSesion.html", 1500);
    return;
  }

  // ================= MODAL =====================
  const modal = document.createElement("div");
  modal.className = "modal-editar";
  modal.innerHTML = `
    <div class="modal-contenido">
      <p id="modalTexto"></p>
      <button id="modalBtnAceptar">Aceptar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const modalTexto = document.getElementById("modalTexto");
  const btnAceptar = document.getElementById("modalBtnAceptar");

  const mostrarModal = (texto) => {
    modalTexto.textContent = texto;
    modal.style.display = "flex";
  };

  btnAceptar.onclick = () => modal.style.display = "none";
  window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });


  const inputNombre = document.getElementById("inputNombre");
  const inputCorreo = document.getElementById("inputCorreo");
  const inputContrasena = document.getElementById("inputContrasena");
  const form = document.getElementById("formAjustes");

  // Prellenar con datos actuales
  inputNombre.value = usuarioGuardado.nombre || '';
  inputCorreo.value = usuarioGuardado.correo || '';

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const datos = {
      nombre: inputNombre.value.trim(),
      correo: inputCorreo.value.trim(),
      contrasena: inputContrasena.value.trim()
    };

    fetch(`http://localhost:3000/api/usuarios/${usuarioGuardado.nick}/editar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        mostrarModal(data.error);
      } else {
        // Actualizo localStorage 
        if (datos.nombre) usuarioGuardado.nombre = datos.nombre;
        if (datos.correo) usuarioGuardado.correo = datos.correo;
        localStorage.setItem("usuario", JSON.stringify(usuarioGuardado));

        mostrarModal("Cambios guardados correctamente");

        // Limpiar password
        inputContrasena.value = '';
      }
    })
    .catch(err => {
      console.error(err);
      mostrarModal("Error al guardar cambios");
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  // Crear contenedor de modal dinámicamente
  const modal = document.createElement("div");
  modal.id = "modalMensaje";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-contenido">
      <p>Gracias por su mensaje, nos pondremos en contacto con usted pronto</p>
      <button id="btnAceptar">Aceptar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const btnAceptar = document.getElementById("btnAceptar");
  btnAceptar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar modal al hacer click fuera del contenido
  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      nombre: document.getElementById("nombre").value.trim(),
      primerApellido: document.getElementById("primerApellido").value.trim(),
      segundoApellido: document.getElementById("segundoApellido").value.trim(),
      correo: document.getElementById("correo").value.trim(),
      tipoMensaje: document.getElementById("tipoMensaje").value,
      mensaje: document.getElementById("mensaje").value.trim(),
    };

    if (!datos.nombre || !datos.primerApellido || !datos.correo || !datos.tipoMensaje || !datos.mensaje) {
      modal.querySelector("p").textContent = "Por favor, completa todos los campos obligatorios.";
      modal.style.display = "flex";
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        modal.style.display = "flex";
        form.reset();

        const ticketCreado = {
          id: result.id,
          ...datos,
          fecha: new Date().toISOString(),
          estado: "No revisado"
        };
        document.dispatchEvent(new CustomEvent("ticketCreado", { detail: ticketCreado }));
      } else {
        modal.querySelector("p").textContent = "Error al enviar mensaje: " + (result.error || "Error desconocido");
        modal.style.display = "flex";
      }

    } catch (err) {
      console.error("Error en la petición:", err);
      modal.querySelector("p").textContent = "No se pudo enviar el mensaje. Revisa la consola.";
      modal.style.display = "flex";
    }
  });
});

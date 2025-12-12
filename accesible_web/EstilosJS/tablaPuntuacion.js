// ==================== Variable global ====================
let usuarioAEditar = null;
let accionPendiente = null;
// ================================================================

window.addEventListener('DOMContentLoaded', async () => {
  const usuarioSesionDiv = document.getElementById('usuarioSesion');
  const colAcciones = document.getElementById('colAcciones');

  // ==================== MODAL DE MENSAJES ==========================
  const modalMensaje = document.createElement('div');
  modalMensaje.className = 'modal-editar';
  modalMensaje.innerHTML = `
    <div class="modal-contenido">
      <p id="textoModal"></p>
      <div id="botonesModal">
        <button id="btnAceptarModal">Aceptar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalMensaje);

  const textoModal = document.getElementById('textoModal');
  const btnAceptarModal = document.getElementById('btnAceptarModal');

  const mostrarModal = (mensaje, onAceptar = null, opciones = { mostrarCancelar: false }) => {
    textoModal.textContent = mensaje;
    const botonesDiv = document.getElementById('botonesModal');
    botonesDiv.innerHTML = '';

    const btnAceptar = document.createElement('button');
    btnAceptar.textContent = 'Aceptar';
    btnAceptar.addEventListener('click', () => {
      modalMensaje.style.display = 'none';
      if (onAceptar) onAceptar();
    });
    botonesDiv.appendChild(btnAceptar);

    if (opciones.mostrarCancelar) {
      const btnCancelar = document.createElement('button');
      btnCancelar.textContent = 'Cancelar';
      btnCancelar.addEventListener('click', () => {
        modalMensaje.style.display = 'none';
      });
      botonesDiv.appendChild(btnCancelar);
    }

    modalMensaje.style.display = 'flex';
  };

  window.addEventListener('click', e => {
    if (e.target === modalMensaje) modalMensaje.style.display = 'none';
  });
  // ==================================================================

  async function cargarUsuarios() {
    try {
      const usuarioActual = JSON.parse(localStorage.getItem('usuario')) || {};
      const esAdmin = usuarioActual.rango === 'administrador';

      if (usuarioSesionDiv) {
        usuarioSesionDiv.textContent = `Sesión: ${usuarioActual.nick || 'Invitado'}`;
      }

      if (colAcciones) colAcciones.style.display = esAdmin ? '' : 'none';

      const usuariosRes = await fetch('http://localhost:3000/api/usuarios', { cache: 'no-store' });
      const usuarios = await usuariosRes.json();

      const tbody = document.querySelector('#tablaPuntuaciones tbody');
      if (!tbody) return console.error('No se encontró tbody en la tabla');
      tbody.innerHTML = '';

      usuarios.forEach((usuario, index) => {
        const tr = document.createElement('tr');

        if (esAdmin) {
          let acciones = `
            <div class="acciones">
              <button onclick="editarUsuario('${usuario.nick}')">Editar</button>
              <button onclick="borrarUsuario('${usuario.nick}')">Borrar</button>
              ${usuario.rango !== 'administrador' ? `<button onclick="nombrarAdmin('${usuario.nick}')">Nombrar Administrador</button>` : ''}
            </div>
          `;
          tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${usuario.nick}</td>
            <td>${usuario.puntos}</td>
            <td>${acciones}</td>
          `;
        } else {
          tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${usuario.nick}</td>
            <td>${usuario.puntos}</td>
          `;
        }

        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      mostrarModal('No se pudieron cargar los usuarios. Asegúrate de que el servidor esté corriendo.');
    }
  }

  // ==================== MODAL DE EDICION ============================
  window.editarUsuario = (nick) => {
    usuarioAEditar = nick;
    document.getElementById('modalEditar').style.display = 'flex';
    document.getElementById('inputNuevoNick').value = nick;
  };

  window.guardarEdicion = async () => {
    const nuevoNick = document.getElementById('inputNuevoNick').value.trim();
    if (!nuevoNick) {
      mostrarModal("El nuevo nick no puede estar vacío");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${encodeURIComponent(usuarioAEditar)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoNick })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error al editar usuario`);

      mostrarModal("Usuario modificado correctamente");
      document.getElementById('modalEditar').style.display = 'none';
      cargarUsuarios();

    } catch (err) {
      console.error('Error al editar usuario:', err);
      mostrarModal(err.message);
    }
  };

  window.cerrarModal = () => {
    document.getElementById('modalEditar').style.display = 'none';
  };

  // ==================== ACCIONES ===========================
  window.borrarUsuario = (nick) => {
    mostrarModal(`¿Seguro que quieres borrar el usuario "${nick}"?`, async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${encodeURIComponent(nick)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Error al borrar usuario: ${res.status}`);
        mostrarModal('Usuario borrado correctamente');
        cargarUsuarios();
      } catch (err) {
        console.error(err);
        mostrarModal('No se pudo borrar el usuario.');
      }
    }, { mostrarCancelar: true });
  };

  window.nombrarAdmin = (nick) => {
    mostrarModal(`¿Seguro que quieres hacer administrador al usuario "${nick}"?`, async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${encodeURIComponent(nick)}/admin`, { method: 'PATCH' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Error al nombrar administrador: ${res.status}`);
        mostrarModal('Usuario ahora es administrador');
        cargarUsuarios();
      } catch (err) {
        console.error(err);
        mostrarModal(`No se pudo hacer administrador: ${err.message}`);
      }
    }, { mostrarCancelar: true });
  };
  // ==================================================================

  window.refrescarTablaUsuarios = cargarUsuarios;

  cargarUsuarios();
});

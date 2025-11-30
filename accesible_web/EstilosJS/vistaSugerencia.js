// --- mostrar modal ---
const mostrarModal = (mensaje, callback) => {
  // Crear contenedor
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.zIndex = '1000';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.fontFamily = 'Arial, sans-serif';

  // Crear contenido
  const contenido = document.createElement('div');
  contenido.style.backgroundColor = '#fff';
  contenido.style.padding = '20px';
  contenido.style.borderRadius = '10px';
  contenido.style.minWidth = '250px';
  contenido.style.textAlign = 'center';
  contenido.textContent = mensaje;

  // Botón cerrar
  const btnCerrar = document.createElement('button');
  btnCerrar.textContent = 'Cerrar';
  btnCerrar.style.marginTop = '15px';
  btnCerrar.style.padding = '5px 10px';
  btnCerrar.style.border = 'none';
  btnCerrar.style.borderRadius = '5px';
  btnCerrar.style.cursor = 'pointer';
  btnCerrar.onclick = () => {
    document.body.removeChild(modal);
    if (callback) callback();
  };

  contenido.appendChild(document.createElement('br'));
  contenido.appendChild(btnCerrar);
  modal.appendChild(contenido);
  document.body.appendChild(modal);
};

document.addEventListener("DOMContentLoaded", async () => {
  document.body.style.fontFamily = 'Arial, sans-serif';

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario || usuario.rango !== "administrador") {
    mostrarModal("Debes ser administrador para ver los tickets", () => {
      window.location.href = "perfil.html";
    });
    return;
  }

  const tbody = document.querySelector("#tablaTickets tbody");
  const filtroNombre = document.getElementById("filtroNombre");
  const filtroTipo = document.getElementById("filtroTipo");
  const filtroOrden = document.getElementById("filtroOrden");
  const filtroModo = document.getElementById("filtroModo");

  document.getElementById("btnVolver").addEventListener("click", () => {
    window.location.href = "perfil.html";
  });

  let tickets = [];

  const prioridadValor = prioridad => {
    switch (prioridad) {
      case 'Alta': return 3;
      case 'Media': return 2;
      case 'Baja': return 1;
      default: return 0;
    }
  };

  const pintarTickets = () => {
    tbody.innerHTML = '';
    const nombreBusqueda = filtroNombre.value.toLowerCase();
    const tipoSeleccionado = filtroTipo.value;
    const ordenPor = filtroOrden.value;
    const modo = filtroModo.value;

    let ticketsFiltrados = tickets
      .filter(ticket => {
        const nombreCompleto = `${ticket.nombre} ${ticket.primerApellido} ${ticket.segundoApellido || ''}`.trim().toLowerCase();
        return nombreBusqueda === "" || nombreCompleto.includes(nombreBusqueda);
      })
      .filter(ticket => tipoSeleccionado === "" || ticket.tipoMensaje === tipoSeleccionado)
      .map(ticket => {
        let prioridad = '';
        let clasePrioridad = '';
        switch (ticket.tipoMensaje) {
          case 'sugerencia':
          case 'apoyo':
            prioridad = 'Baja'; clasePrioridad = 'prioridad-baja'; break;
          case 'queja':
            prioridad = 'Media'; clasePrioridad = 'prioridad-media'; break;
          case 'problemaTecnico':
            prioridad = 'Alta'; clasePrioridad = 'prioridad-alta'; break;
          default:
            prioridad = 'Desconocida'; clasePrioridad = '';
        }
        return { ...ticket, prioridad, clasePrioridad };
      });

    ticketsFiltrados.sort((a, b) => {
      let comp = 0;
      if (ordenPor === 'nombre') {
        const nombreA = `${a.nombre} ${a.primerApellido} ${a.segundoApellido || ''}`.trim().toLowerCase();
        const nombreB = `${b.nombre} ${b.primerApellido} ${b.segundoApellido || ''}`.trim().toLowerCase();
        comp = nombreA.localeCompare(nombreB);
      } else if (ordenPor === 'fecha') {
        comp = new Date(a.fecha) - new Date(b.fecha);
      } else if (ordenPor === 'prioridad') {
        comp = prioridadValor(a.prioridad) - prioridadValor(b.prioridad);
      }
      return modo === 'asc' ? comp : -comp;
    });

    ticketsFiltrados.forEach(ticket => {
      const ticketId = ticket.id;
      if (!ticketId) return;

      let opciones = '';
      if (ticket.estado === 'No revisado') {
        opciones = `<option value="No revisado" selected disabled>No revisado</option>
                    <option value="En proceso">En proceso</option>`;
      } else if (ticket.estado === 'En proceso') {
        if (ticket.tipoMensaje === 'sugerencia' || ticket.tipoMensaje === 'apoyo') {
          opciones = `<option value="En proceso" selected disabled>En proceso</option>
                      <option value="Revisado">Revisado</option>`;
        } else {
          opciones = `<option value="En proceso" selected disabled>En proceso</option>
                      <option value="Cerrado">Cerrado</option>`;
        }
      } else {
        opciones = `<option value="${ticket.estado}" selected disabled>${ticket.estado}</option>`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ticket.nombre} ${ticket.primerApellido} ${ticket.segundoApellido || ''}</td>
        <td>${ticket.correo}</td>
        <td>${ticket.tipoMensaje}</td>
        <td>${ticket.mensaje}</td>
        <td>${new Date(ticket.fecha).toLocaleString()}</td>
        <td>
          <select class="estadoTicket" data-id="${ticketId}">
            ${opciones}
          </select>
        </td>
        <td class="${ticket.clasePrioridad}">${ticket.prioridad}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  try {
    const response = await fetch(`http://localhost:3000/api/contacto?nick=${usuario.nick}`);
    tickets = await response.json();

    if (!response.ok) {
      mostrarModal("Error: " + (tickets.error || "No autorizado"), () => {
        window.location.href = "perfil.html";
      });
      return;
    }

    // Rellenar filtro tipo
    const tiposUnicos = [...new Set(tickets.map(t => t.tipoMensaje))];
    tiposUnicos.forEach(tipo => {
      const option = document.createElement("option");
      option.value = tipo;
      option.textContent = tipo;
      filtroTipo.appendChild(option);
    });

    [filtroNombre, filtroTipo, filtroOrden, filtroModo].forEach(f => f.addEventListener('input', pintarTickets));

    pintarTickets();

    tbody.addEventListener('change', async (e) => {
      if (!e.target.classList.contains('estadoTicket')) return;

      const id = e.target.dataset.id;
      const nuevoEstado = e.target.value;

      try {
        const res = await fetch(`http://localhost:3000/api/contacto/${id}/estado?nick=${usuario.nick}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo actualizar el estado.");

        tickets = tickets.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t);
        pintarTickets();
        location.reload();
      } catch (err) {
        console.error("Error al actualizar estado:", err);
        mostrarModal("Error al actualizar el estado del ticket");
      }
    });

  } catch (err) {
    console.error("Error cargando tickets:", err);
    mostrarModal("Error al cargar los tickets");
  }
});

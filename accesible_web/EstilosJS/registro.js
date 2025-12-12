document.getElementById('registroForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  limpiarErrores();

  const nombreInput = document.getElementById('nombre');
  const nickInput = document.getElementById('usuario');
  const correoInput = document.getElementById('correo');
  const passInput = document.getElementById('password');
  const confirmarInput = document.getElementById('confirmar');
  const submitBtn = this.querySelector('button[type="submit"]');

  // Modal elementos
  const modal = document.getElementById('modalRegistro');
  const modalPuntos = document.getElementById('modalPuntos');

  const nombre = nombreInput.value.trim();
  const nick = nickInput.value.trim();
  const correo = correoInput.value.trim();
  const contrasena = passInput.value;
  const confirmar = confirmarInput.value;

  // ---------- VALIDACIONES ----------
  function validarNombre(nombre) {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    return nombre.length > 0 && regex.test(nombre);
  }

  function validarNombreUsuario(usuario) {
    const tieneLetra = /[A-Za-z]/.test(usuario);
    const tieneNumero = /[0-9]/.test(usuario);
    const tieneSimbolo = /[^A-Za-z0-9]/.test(usuario);
    return usuario.length >= 6 && tieneLetra && tieneNumero && tieneSimbolo;
  }

  function validarContrasena(pass) {
    const tieneLetra = /[A-Za-z]/.test(pass);
    const tieneNumero = /[0-9]/.test(pass);
    const tieneSimbolo = /[^A-Za-z0-9]/.test(pass);
    return pass.length >= 8 && tieneLetra && tieneNumero && tieneSimbolo;
  }

  function validarCorreo(correo) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  }

  function mostrarError(idCampo, mensaje) {
    const campo = document.getElementById(idCampo);
    campo.textContent = mensaje;
    campo.style.display = "block";
  }

  function limpiarErrores() {
    document.querySelectorAll(".error").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // ---------- VALIDACIONES LOCALES ----------
  if (!validarNombre(nombre)) {
    mostrarError('errorNombre', 'El nombre solo puede tener letras y espacios.');
    nombreInput.focus();
    return;
  }

  if (!validarNombreUsuario(nick)) {
    mostrarError('errorUsuario', 'El usuario debe tener al menos 6 caracteres, incluyendo letra, número y símbolo.');
    nickInput.focus();
    return;
  }

  if (!validarCorreo(correo)) {
    mostrarError('errorCorreo', 'Introduce un correo válido (ej: usuario@ejemplo.com).');
    correoInput.focus();
    return;
  }

  if (!validarContrasena(contrasena)) {
    mostrarError('errorPassword', 'La contraseña debe tener mínimo 8 caracteres, letra, número y símbolo.');
    passInput.focus();
    return;
  }

  if (contrasena !== confirmar) {
    mostrarError('errorConfirmar', 'Las contraseñas no coinciden.');
    confirmarInput.focus();
    return;
  }

  // ---------- ENVIAR SERVIDOR ----------
  const payload = { nombre, nick, correo, contrasena, rango: 'usuario' };
  submitBtn.disabled = true;
  submitBtn.textContent = 'Registrando...';

  try {
    const res = await fetch('http://localhost:3000/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const msg = await res.text();

    if (!res.ok) {
      // COINCIDENCIAS
      if (msg === "correo_existente") {
        mostrarError('errorCorreo', 'Este correo ya tiene una cuenta registrada.');
        correoInput.focus();
      } else if (msg === "nick_existente") {
        mostrarError('errorUsuario', 'Este nombre de usuario ya está en uso.');
        nickInput.focus();
      } else {
        alert(msg || "Error al crear la cuenta");
      }
      return;
    }

    // ---------- REGISTRO EXITOSO CON MODAL ----------
    let puntos = 0;
    modal.style.display = "flex"; // mostrar modal
    modalPuntos.textContent = '';

    const intervalo = setInterval(() => {
      puntos = (puntos + 1) % 4; // 0,1,2,3
      modalPuntos.textContent = '.'.repeat(puntos);
    }, 500);

    setTimeout(() => {
      clearInterval(intervalo);
      window.location.href = '../ContenidoExtra/inicioSesion.html';
    }, 3000); 

  } catch (err) {
    console.error('Error:', err);
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Registrarse';
  }
});

const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const path = require('path');

const nodemailer = require('nodemailer');

// Configurar transporte de correo con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mythbasics@gmail.com',
    pass: 'iivk wgkg cjqx uwsy'
  }
});

const app = express();

// --- Middleware JSON (antes de todas las rutas) ---
app.use(express.json({ limit: '50mb' }));

// --- Configurar CORS ---
app.use(cors());

// --- Conexión a MySQL ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'usuarios'
});

db.connect(err => {
  if (err) console.error('Error al conectar a MySQL:', err);
  else console.log('Conectado correctamente a MySQL');
});

// ---------------- REGISTRO ----------------
app.post('/registro', (req, res) => {
  const { nombre, nick, correo, contrasena } = req.body;
  if (!nombre || !nick || !correo || !contrasena) return res.status(400).send('Faltan datos');

  const sql = 'INSERT INTO usuarios (nombre, nick, correo, contrasena, rango, puntos) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [nombre, nick, correo, contrasena, 'usuario', 0], (err) => {
    if (err) return res.status(500).send('Error en el servidor');
    res.status(200).send('Usuario registrado');
  });
});

// ---------------- LOGIN ----------------
app.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;
  if (!usuario || !contrasena) return res.status(400).send('Faltan datos');

  const sql = 'SELECT nombre, nick, correo, rango, puntos, foto FROM usuarios WHERE nick = ? AND contrasena = ?';
  db.query(sql, [usuario, contrasena], (err, result) => {
    if (err) return res.status(500).send('Error en el servidor');
    if (result.length > 0) {
      res.status(200).json({ mensaje: 'Sesión iniciada', usuario: result[0] });
    } else {
      res.status(401).send('Usuario o contraseña incorrectos');
    }
  });
});

// ---------------- OBTENER USUARIO POR NICK ----------------
app.get('/api/usuarios/:nick', (req, res) => {
  const { nick } = req.params;
  const sql = 'SELECT nombre, nick, rango, COALESCE(puntos,0) AS puntos, foto FROM usuarios WHERE nick = ?';
  db.query(sql, [nick], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(results[0]);
  });
});

// ---------------- TABLA DE PUNTUACIONES ----------------
app.get('/api/usuarios', (req, res) => {
  const sql = 'SELECT nombre, nick, rango, COALESCE(puntos,0) AS puntos, foto FROM usuarios ORDER BY puntos DESC, nombre ASC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    res.json(results);
  });
});

// ---------------- EDITAR USUARIO ----------------
app.put('/api/usuarios/:nick', (req, res) => {
  const { nick } = req.params;
  const { nuevoNick } = req.body;

  if (!nuevoNick || nuevoNick.trim() === '') {
    return res.status(400).json({ error: 'Falta el nuevo nick o está vacío.' });
  }

  const checkSql = 'SELECT * FROM usuarios WHERE nick = ?';
  db.query(checkSql, [nick], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al verificar usuario.' });
    if (result.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const checkDuplicate = 'SELECT * FROM usuarios WHERE nick = ?';
    db.query(checkDuplicate, [nuevoNick], (errDup, resDup) => {
      if (errDup) return res.status(500).json({ error: 'Error al comprobar duplicado.' });
      if (resDup.length > 0) return res.status(400).json({ error: 'El nuevo nick ya está en uso.' });

      const updateSql = 'UPDATE usuarios SET nick = ? WHERE nick = ?';
      db.query(updateSql, [nuevoNick, nick], (err2) => {
        if (err2) return res.status(500).json({ error: 'Error al actualizar usuario' });

        const getUpdated = 'SELECT nombre, nick, correo, rango, puntos, foto FROM usuarios WHERE nick = ?';
        db.query(getUpdated, [nuevoNick], (err3, updatedResult) => {
          if (err3) return res.status(500).json({ error: 'Error al obtener usuario actualizado' });

          res.json({ mensaje: 'Nick actualizado', usuario: updatedResult[0] });
        });
      });
    });
  });
});

// ---------------- BORRAR USUARIO ----------------
app.delete('/api/usuarios/:nick', (req, res) => {
  const { nick } = req.params;
  const sql = 'DELETE FROM usuarios WHERE nick = ?';
  db.query(sql, [nick], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al borrar usuario' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario borrado correctamente' });
  });
});

// ---------------- NOMBRAR ADMIN ----------------
app.patch('/api/usuarios/:nick/admin', (req, res) => {
  const { nick } = req.params;
  const checkSql = 'SELECT rango FROM usuarios WHERE nick = ?';
  db.query(checkSql, [nick], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (results[0].rango === 'administrador') {
      return res.status(400).json({ error: 'El usuario ya es administrador' });
    }

    const updateSql = 'UPDATE usuarios SET rango = ? WHERE nick = ?';
    db.query(updateSql, ['administrador', nick], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al actualizar rango' });
      res.json({ mensaje: 'El usuario ahora es administrador', rango: 'administrador' });
    });
  });
});

// ---------------- ACTUALIZAR PUNTOS ----------------
app.patch('/api/usuarios/:nick/puntos', (req, res) => {
  const { nick } = req.params;
  const { puntos } = req.body;

  if (typeof puntos !== 'number') return res.status(400).json({ error: 'Se requiere un número válido de puntos' });

  const sql = 'UPDATE usuarios SET puntos = GREATEST(puntos, ?) WHERE nick = ?';
  db.query(sql, [puntos, nick], (err, result) => {
    if (err) return res.status(500).json({ error: 'No se pudieron actualizar los puntos' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const selectSql = 'SELECT puntos FROM usuarios WHERE nick = ?';
    db.query(selectSql, [nick], (err2, results) => {
      if (err2 || results.length === 0) return res.status(500).json({ error: 'Error al obtener puntos actualizados' });

      res.json({ mensaje: 'Puntos actualizados correctamente', puntosActuales: results[0].puntos });
    });
  });
});

// ---------------- SUBIR FOTO BASE64 ----------------
app.post('/api/usuarios/:nick/foto', (req, res) => {
  const { nick } = req.params;
  const { foto } = req.body;

  if (!foto) return res.status(400).json({ error: 'No se envió ninguna imagen' });

  const sql = 'UPDATE usuarios SET foto = ? WHERE nick = ?';
  db.query(sql, [foto, nick], (err) => {
    if (err) return res.status(500).json({ error: 'Error al guardar en la base de datos' });

    res.json({ success: true, foto });
  });
});

// ---------------- EDITAR CREDENCIALES ----------------
app.put('/api/usuarios/:nick/editar', (req, res) => {
  const { nick } = req.params;
  const { nombre, correo, contrasena } = req.body;

  if (!nombre && !correo && !contrasena) {
    return res.status(400).json({ error: 'No se proporcionó ningún dato para actualizar' });
  }

  const campos = [];
  const valores = [];

  if (nombre && nombre.trim() !== '') { campos.push('nombre = ?'); valores.push(nombre.trim()); }
  if (correo && correo.trim() !== '') { campos.push('correo = ?'); valores.push(correo.trim()); }
  if (contrasena && contrasena.trim() !== '') { campos.push('contrasena = ?'); valores.push(contrasena.trim()); }

  if (campos.length === 0) return res.status(400).json({ error: 'Datos inválidos' });

  valores.push(nick);

  const sql = `UPDATE usuarios SET ${campos.join(', ')} WHERE nick = ?`;
  db.query(sql, valores, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar datos' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ mensaje: 'Datos actualizados correctamente', nombre: nombre || undefined, correo: correo || undefined });
  });
});

// ---------------- CAMBIAR A RANGO PREMIUM ----------------
app.patch('/api/usuarios/:nick/premium', (req, res) => {
  const { nick } = req.params;

  const sqlCheck = "SELECT rango FROM usuarios WHERE nick = ?";
  db.query(sqlCheck, [nick], (err, result) => {
    if (err) return res.status(500).json({ error: "Error del servidor" });
    if (result.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    if (result[0].rango !== "usuario") return res.status(400).json({ error: "Solo los usuarios con rango 'usuario' pueden pasar a premium" });

    const sqlUpdate = "UPDATE usuarios SET rango = 'premium' WHERE nick = ?";
    db.query(sqlUpdate, [nick], (err2) => {
      if (err2) return res.status(500).json({ error: "Error al actualizar rango" });

      res.json({ mensaje: "Ahora eres usuario premium ✨", rango: "premium" });
    });
  });
});

// ---------------- CHAT ----------------
app.get('/api/chat', (req, res) => {
  const sql = `
    SELECT m.id, m.usuario_nick AS nick, m.texto, m.fecha, 
       u.nombre, u.foto, u.rango
    FROM chat_mensajes m
    JOIN usuarios u ON m.usuario_nick = u.nick
    ORDER BY m.fecha ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener mensajes' });
    res.json(results);
  });
});

app.post('/api/chat', (req, res) => {
  const { nick, texto } = req.body;
  if (!nick || !texto) return res.status(400).json({ ok: false, error: 'Faltan datos' });

  const sql = 'INSERT INTO chat_mensajes (usuario_nick, texto) VALUES (?, ?)';
  db.query(sql, [nick, texto], (err, result) => {
    if (err) return res.status(500).json({ ok: false, error: 'Error al guardar mensaje de chat' });
    res.json({ ok: true, mensaje: 'Mensaje de chat guardado correctamente' });
  });
});

// EDITAR MENSAJE
app.put('/api/chat/:id', (req, res) => {
  const { id } = req.params;
  const { nick, texto } = req.body;

  if (!texto || !nick) return res.status(400).json({ ok: false, error: "Faltan datos" });

  const sqlCheck = "SELECT usuario_nick FROM chat_mensajes WHERE id = ?";
  db.query(sqlCheck, [id], (err, result) => {
    if (err) return res.status(500).json({ ok: false });
    if (result.length === 0) return res.status(404).json({ ok: false, error: "Mensaje no encontrado" });

    const duenio = result[0].usuario_nick;

    const sqlUser = "SELECT rango FROM usuarios WHERE nick = ?";
    db.query(sqlUser, [nick], (err2, resUser) => {
      if (err2) return res.status(500).json({ ok: false });
      const rango = resUser[0].rango;

      if (duenio !== nick && rango !== "administrador") {
        return res.status(403).json({ ok: false, error: "No tienes permiso" });
      }

      const sqlUpdate = "UPDATE chat_mensajes SET texto = ? WHERE id = ?";
      db.query(sqlUpdate, [texto, id], () => {
        res.json({ ok: true, mensaje: "Mensaje editado" });
      });
    });
  });
});

// BORRAR MENSAJE
app.delete('/api/chat/:id', (req, res) => {
  const { id } = req.params;
  const nick = req.query.nick; // <-- Leer nick desde query param

  const sqlCheck = "SELECT usuario_nick FROM chat_mensajes WHERE id = ?";
  db.query(sqlCheck, [id], (err, result) => {
    if (err) return res.status(500).json({ ok: false });
    if (result.length === 0) return res.status(404).json({ ok: false });

    const duenio = result[0].usuario_nick;

    const sqlUser = "SELECT rango FROM usuarios WHERE nick = ?";
    db.query(sqlUser, [nick], (err2, resUser) => {
      if (err2) return res.status(500).json({ ok: false });

      const rango = resUser[0].rango;

      if (duenio !== nick && rango !== "administrador") {
        return res.status(403).json({ ok: false, error: "No tienes permiso" });
      }

      db.query("DELETE FROM chat_mensajes WHERE id = ?", [id], err3 => {
        if (err3) return res.status(500).json({ ok: false });

        res.json({ ok: true, mensaje: "Mensaje borrado" });
      });
    });
  });
});


// ---------------- CONTACTO ----------------
app.post("/api/contacto", async (req, res) => {
  const { nombre, primerApellido, segundoApellido, correo, tipoMensaje, mensaje } = req.body;

  if (!nombre || !primerApellido || !correo || !tipoMensaje || !mensaje) {
    return res.status(400).json({ ok: false, error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO contacto (nombre, primerApellido, segundoApellido, correo, tipoMensaje, mensaje)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, primerApellido, segundoApellido || '', correo, tipoMensaje, mensaje], async (err, result) => {
    if (err) {
      console.error("Error al guardar mensaje de contacto:", err);
      return res.status(500).json({ ok: false, error: "Error al guardar el mensaje" });
    }

    // Devuelve el ID generado
    const nuevoId = result.insertId;

    // --- Enviar correo ---
    const mailOptions = {
      from: 'mythbasics@gmail.com',
      to: 'mythbasics@gmail.com',
      subject: `Nuevo mensaje de contacto de ${nombre} ${primerApellido}`,
      text: `
      Nombre: ${nombre} ${primerApellido}
      Correo: ${correo}
      Tipo de mensaje: ${tipoMensaje}
      Mensaje: ${mensaje}
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Correo enviado:', info.response);

      // Devuelve también el ID generado
      return res.status(200).json({ ok: true, id: nuevoId, mensaje: "Mensaje guardado correctamente y correo enviado" });
    } catch (err) {
      console.error('Error enviando correo:', err);
      return res.status(500).json({ ok: false, error: 'Error al enviar correo' });
    }
  });
});
// ---------------- CONTACTO ----------------

// Crear un contacto
app.post("/api/contacto", async (req, res) => {
  const { nombre, primerApellido, segundoApellido, correo, tipoMensaje, mensaje } = req.body;

  if (!nombre || !primerApellido || !correo || !tipoMensaje || !mensaje) {
    return res.status(400).json({ ok: false, error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO contacto (nombre, primerApellido, segundoApellido, correo, tipoMensaje, mensaje)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, primerApellido, segundoApellido || '', correo, tipoMensaje, mensaje], async (err, result) => {
    if (err) {
      console.error("Error al guardar mensaje de contacto:", err);
      return res.status(500).json({ ok: false, error: "Error al guardar el mensaje" });
    }

    const nuevoId = result.insertId;

    // --- Enviar correo ---
    const mailOptions = {
      from: 'mythbasics@gmail.com',
      to: 'mythbasics@gmail.com',
      subject: `Nuevo mensaje de contacto de ${nombre} ${primerApellido}`,
      text: `
        Nombre: ${nombre} ${primerApellido}
        Correo: ${correo}
        Tipo de mensaje: ${tipoMensaje}
        Mensaje: ${mensaje}
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Correo enviado:', info.response);
      return res.status(200).json({ ok: true, id: nuevoId, mensaje: "Mensaje guardado correctamente y correo enviado" });
    } catch (err) {
      console.error('Error enviando correo:', err);
      return res.status(500).json({ ok: false, error: 'Error al enviar correo' });
    }
  });
});

// ---------------- OBTENER TODOS LOS CONTACTOS (Solo admin) ----------------
app.get('/api/contacto', (req, res) => {
  const { nick } = req.query;

  if (!nick) return res.status(400).json({ ok: false, error: "Falta el nick del usuario" });

  const checkAdmin = 'SELECT rango FROM usuarios WHERE nick = ?';

  db.query(checkAdmin, [nick], (err, results) => {
    if (err) return res.status(500).json({ ok: false, error: 'Error en el servidor' });
    if (results.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    if (results[0].rango !== 'administrador') return res.status(403).json({ ok: false, error: 'No tienes permisos' });

    const sql = `
      SELECT 
        id AS id,
        nombre,
        primerApellido,
        segundoApellido,
        correo,
        tipoMensaje,
        mensaje,
        fecha,
        estado
      FROM contacto
      ORDER BY fecha DESC
    `;

    db.query(sql, (err2, contactos) => {
      if (err2) return res.status(500).json({ ok: false, error: 'Error al obtener contactos' });

      // Convertir RowDataPacket a objetos puros
      const contactosLimpios = contactos.map(c => ({
        id: c.id,
        nombre: c.nombre,
        primerApellido: c.primerApellido,
        segundoApellido: c.segundoApellido,
        correo: c.correo,
        tipoMensaje: c.tipoMensaje,
        mensaje: c.mensaje,
        fecha: c.fecha,
        estado: c.estado
      }));

      res.json(contactosLimpios);
    });
  });
});

// ---------------- ACTUALIZAR ESTADO DE CONTACTO ----------------
app.patch('/api/contacto/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const { nick } = req.query;

  if (!nick) return res.status(400).json({ ok: false, error: "Falta el nick del usuario" });
  if (!estado || !['No revisado', 'En proceso', 'Revisado', 'Cerrado'].includes(estado)) {
    return res.status(400).json({ ok: false, error: "Estado inválido" });
  }

  const checkAdmin = 'SELECT rango FROM usuarios WHERE nick = ?';

  db.query(checkAdmin, [nick], (err, results) => {
    if (err) return res.status(500).json({ ok: false, error: 'Error en el servidor' });
    if (results.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    if (results[0].rango !== 'administrador') return res.status(403).json({ ok: false, error: 'No tienes permisos' });

    const sql = 'UPDATE contacto SET estado = ? WHERE id = ?';
    db.query(sql, [estado, id], (err2, result) => {
      if (err2) return res.status(500).json({ ok: false, error: 'Error al actualizar el estado' });
      if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Ticket no encontrado' });

      res.json({ ok: true, mensaje: 'Estado actualizado correctamente' });
    });
  });
});


// --- Servir contenido estático ---
app.use(express.static(path.join(__dirname, 'ContenidoExtra')));

// ---------------- INICIAR SERVIDOR ----------------
app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});

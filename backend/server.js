require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log(`✔ Cloudinary conectado (${process.env.CLOUDINARY_CLOUD_NAME})`);
}

const useWindowsAuth = !process.env.DB_USER;
const config = {
  ...(useWindowsAuth ? {} : {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'Biblioteca',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    ...(useWindowsAuth ? { trustedConnection: true } : {}),
  },
};
const poolPromise = new sql.ConnectionPool(config).connect()
  .then(p => { console.log('✔ Conectado a SQL Server'); return p; })
  .catch(e => { console.error('✘ Error de conexión:', e.message); process.exit(1); });

// ---------- helpers ----------
const run = async (text, params = {}) => {
  const pool = await poolPromise;
  const r = pool.request();
  for (const [k, v] of Object.entries(params)) r.input(k, v);
  return (await r.query(text)).recordset;
};
const trq = (t, text, params = {}) => {           // query dentro de una transacción
  const r = t.request();
  for (const [k, v] of Object.entries(params)) r.input(k, v);
  return r.query(text);
};
// BEGIN TRANSACTION -> COMMIT si todo sale bien, ROLLBACK si algo lanza error
async function transaccion(fn) {
  const pool = await poolPromise;
  const t = new sql.Transaction(pool);
  await t.begin();                                 // BEGIN TRANSACTION
  try {
    const result = await fn(t);
    await t.commit();                              // COMMIT
    return result;
  } catch (e) {
    await t.rollback();                            // ROLLBACK
    e.rollback = true;
    throw e;
  }
}
const wrap = fn => (req, res) => fn(req, res).catch(e => {
  console.error(e.message);
  res.status(400).json({ error: e.message, rollback: !!e.rollback });
});

// ---------- USUARIOS ----------
app.get('/api/usuarios', wrap(async (_q, res) =>
  res.json(await run('SELECT * FROM Usuarios ORDER BY id_usuario'))));

app.post('/api/usuarios', wrap(async (req, res) => {
  const { nombre, telefono } = req.body;
  if (!nombre) throw new Error('El nombre es obligatorio');
  await run('INSERT INTO Usuarios (nombre, telefono) VALUES (@nombre, @telefono)', { nombre, telefono });
  res.json({ ok: true });
}));

// ---------- LIBROS ----------
app.get('/api/libros', wrap(async (_q, res) =>
  res.json(await run('SELECT * FROM Libros ORDER BY id_libro'))));

app.post('/api/libros', wrap(async (req, res) => {
  let { titulo, autor, stock, portada_url, imagen_base64 } = req.body;
  if (!titulo) throw new Error('El título es obligatorio');

  // Si enviaron una imagen en Base64, subirla directamente a Cloudinary
  if (imagen_base64 && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const uploadRes = await cloudinary.uploader.upload(imagen_base64, {
        folder: 'biblioteca_fini/portadas',
      });
      portada_url = uploadRes.secure_url;
    } catch (e) {
      console.error('Error al subir imagen a Cloudinary:', e.message);
    }
  }

  await run(
    'INSERT INTO Libros (titulo, autor, stock, portada_url) VALUES (@titulo, @autor, @stock, @portada_url)',
    {
      titulo,
      autor,
      stock: parseInt(stock) || 0,
      portada_url: portada_url || null,
    }
  );
  res.json({ ok: true, portada_url });
}));

// Endpoint auxiliar para subir imagen a Cloudinary por separado si se desea
app.post('/api/upload', wrap(async (req, res) => {
  const { imagen } = req.body;
  if (!imagen) throw new Error('No se recibió ninguna imagen');
  const uploadRes = await cloudinary.uploader.upload(imagen, {
    folder: 'biblioteca_fini/portadas',
  });
  res.json({ ok: true, url: uploadRes.secure_url });
}));

// ---------- PRÉSTAMOS (JOIN de las 4 tablas) ----------
const SQL_PRESTAMOS = `
SELECT p.id_prestamo, u.id_usuario, u.nombre AS usuario, l.titulo, l.autor, l.portada_url,
       p.fecha_salida, p.fecha_devolucion, d.estado_libro
FROM Prestamos p
INNER JOIN Usuarios u         ON u.id_usuario = p.id_usuario
INNER JOIN Detalle_Prestamo d ON d.id_prestamo = p.id_prestamo
INNER JOIN Libros l           ON l.id_libro = d.id_libro
ORDER BY p.id_prestamo DESC`;

app.get('/api/prestamos', wrap(async (_q, res) => res.json(await run(SQL_PRESTAMOS))));

// TRANSACCIÓN 1: nuevo préstamo (varios libros). Si un libro no tiene stock -> ROLLBACK de todo
app.post('/api/prestamos', wrap(async (req, res) => {
  const { id_usuario, libros } = req.body;
  const ids = [...new Set(libros || [])];
  if (!id_usuario || ids.length === 0) throw new Error('Elige un usuario y al menos un libro');

  const id = await transaccion(async t => {
    const p = await trq(t, `INSERT INTO Prestamos (id_usuario, fecha_salida)
                            OUTPUT INSERTED.id_prestamo
                            VALUES (@id_usuario, CAST(GETDATE() AS DATE))`, { id_usuario });
    const id_prestamo = p.recordset[0].id_prestamo;

    for (const id_libro of ids) {
      const up = await trq(t, 'UPDATE Libros SET stock = stock - 1 WHERE id_libro = @id_libro AND stock > 0', { id_libro });
      if (up.rowsAffected[0] === 0) {
        const [l] = (await trq(t, 'SELECT titulo FROM Libros WHERE id_libro=@id_libro', { id_libro })).recordset;
        throw new Error(`Sin stock: "${l ? l.titulo : id_libro}". No se registró ningún préstamo.`);
      }
      await trq(t, "INSERT INTO Detalle_Prestamo (id_prestamo, id_libro, estado_libro) VALUES (@id_prestamo, @id_libro, 'Prestado')",
        { id_prestamo, id_libro });
    }
    return id_prestamo;
  });
  res.json({ ok: true, id_prestamo: id });
}));

// TRANSACCIÓN 2: devolver préstamo (cierra préstamo + devuelve stock)
app.put('/api/prestamos/:id/devolver', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  await transaccion(async t => {
    const up = await trq(t, `UPDATE Prestamos SET fecha_devolucion = CAST(GETDATE() AS DATE)
                             WHERE id_prestamo = @id AND fecha_devolucion IS NULL`, { id });
    if (up.rowsAffected[0] === 0) throw new Error('El préstamo no existe o ya fue devuelto');
    await trq(t, `UPDATE Libros SET stock = stock + 1
                  WHERE id_libro IN (SELECT id_libro FROM Detalle_Prestamo WHERE id_prestamo = @id)`, { id });
    await trq(t, "UPDATE Detalle_Prestamo SET estado_libro = 'Devuelto' WHERE id_prestamo = @id", { id });
  });
  res.json({ ok: true });
}));

// TRANSACCIÓN 3: transferir un préstamo activo a otro usuario
app.put('/api/prestamos/:id/transferir', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const { id_usuario_destino } = req.body;
  await transaccion(async t => {
    const u = await trq(t, 'SELECT id_usuario FROM Usuarios WHERE id_usuario = @d', { d: id_usuario_destino });
    if (u.recordset.length === 0) throw new Error('El usuario destino no existe');
    const up = await trq(t, `UPDATE Prestamos SET id_usuario = @d
                             WHERE id_prestamo = @id AND fecha_devolucion IS NULL`, { d: id_usuario_destino, id });
    if (up.rowsAffected[0] === 0) throw new Error('El préstamo no existe o ya fue devuelto');
  });
  res.json({ ok: true });
}));

// ---------- REPORTES (consultas con JOIN) ----------
const REPORTES = {
  pendientes: {
    titulo: 'Préstamos pendientes',
    sql: `SELECT p.id_prestamo, u.nombre AS usuario, u.telefono, l.titulo, p.fecha_salida
FROM Prestamos p
INNER JOIN Usuarios u         ON u.id_usuario = p.id_usuario
INNER JOIN Detalle_Prestamo d ON d.id_prestamo = p.id_prestamo
INNER JOIN Libros l           ON l.id_libro = d.id_libro
WHERE p.fecha_devolucion IS NULL
ORDER BY p.fecha_salida`,
  },
  masPrestados: {
    titulo: 'Libros más prestados',
    sql: `SELECT l.titulo, l.autor, COUNT(d.id_prestamo) AS veces_prestado
FROM Libros l
LEFT JOIN Detalle_Prestamo d ON d.id_libro = l.id_libro
GROUP BY l.titulo, l.autor
ORDER BY veces_prestado DESC`,
  },
  porUsuario: {
    titulo: 'Préstamos por usuario',
    sql: `SELECT u.nombre, COUNT(p.id_prestamo) AS total_prestamos
FROM Usuarios u
LEFT JOIN Prestamos p ON p.id_usuario = u.id_usuario
GROUP BY u.nombre
ORDER BY total_prestamos DESC`,
  },
  sinPrestamos: {
    titulo: 'Usuarios sin préstamos registrados',
    sql: `SELECT u.id_usuario, u.nombre, u.telefono
FROM Usuarios u
LEFT JOIN Prestamos p ON p.id_usuario = u.id_usuario
WHERE p.id_prestamo IS NULL`,
  },
  stockBajo: {
    titulo: 'Libros con poco stock',
    sql: `SELECT l.titulo, l.stock,
       SUM(CASE WHEN d.estado_libro = 'Prestado' THEN 1 ELSE 0 END) AS prestados_ahora
FROM Libros l
LEFT JOIN Detalle_Prestamo d ON d.id_libro = l.id_libro
GROUP BY l.titulo, l.stock
HAVING l.stock <= 1`,
  },
};
app.get('/api/reportes', (_q, res) =>
  res.json(Object.entries(REPORTES).map(([id, r]) => ({ id, titulo: r.titulo }))));
app.get('/api/reportes/:id', wrap(async (req, res) => {
  const r = REPORTES[req.params.id];
  if (!r) throw new Error('Reporte no existe');
  res.json({ titulo: r.titulo, sql: r.sql, rows: await run(r.sql) });
}));

app.listen(process.env.PORT || 3001, () => console.log('API en http://localhost:' + (process.env.PORT || 3001)));

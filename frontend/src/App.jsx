import { useEffect, useState, useCallback } from 'react';

async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) { const e = new Error(data.error || 'Error'); e.rollback = data.rollback; throw e; }
  return data;
}
const fmt = d => (d ? String(d).slice(0, 10) : '—');

function Tabla({ rows }) {
  if (!rows.length) return <p className="vacio">No hay datos todavía.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="scroll">
      <table>
        <thead><tr>{cols.map(c => <th key={c}>{c.replaceAll('_', ' ')}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>{cols.map(c => <td key={c}>{c.startsWith('fecha') ? fmt(r[c]) : String(r[c] ?? '—')}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/* ---------- Préstamos ---------- */
function Prestamos({ usuarios, aviso, refrescar }) {
  const [rows, setRows] = useState([]);
  const cargar = useCallback(() => api('/api/prestamos').then(setRows), []);
  useEffect(() => { cargar(); }, [cargar]);

  const devolver = async id => {
    try { await api(`/api/prestamos/${id}/devolver`, 'PUT'); aviso('ok', `Préstamo #${id} devuelto (COMMIT)`); }
    catch (e) { aviso('err', e.message, e.rollback); }
    cargar(); refrescar();
  };
  const transferir = async (id, dest) => {
    if (!dest) return;
    try { await api(`/api/prestamos/${id}/transferir`, 'PUT', { id_usuario_destino: parseInt(dest) }); aviso('ok', `Préstamo #${id} transferido (COMMIT)`); }
    catch (e) { aviso('err', e.message, e.rollback); }
    cargar();
  };

  return (
    <section>
      <h2>Préstamos registrados</h2>
      <p className="nota">Consulta con <b>INNER JOIN</b> entre Prestamos, Usuarios, Detalle_Prestamo y Libros.</p>
      <div className="scroll">
        <table>
          <thead><tr><th>#</th><th>Usuario</th><th>Libro</th><th>Salida</th><th>Devolución</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map(r => {
              const activo = !r.fecha_devolucion;
              return (
                <tr key={r.id_prestamo + '-' + r.titulo}>
                  <td>{r.id_prestamo}</td><td>{r.usuario}</td>
                  <td>{r.titulo}<small>{r.autor}</small></td>
                  <td>{fmt(r.fecha_salida)}</td><td>{fmt(r.fecha_devolucion)}</td>
                  <td><span className={'tag ' + (activo ? 'activo' : 'hecho')}>{r.estado_libro}</span></td>
                  <td className="acciones">
                    {activo ? (<>
                      <button onClick={() => devolver(r.id_prestamo)}>Devolver</button>
                      <select value="" onChange={e => transferir(r.id_prestamo, e.target.value)}>
                        <option value="">Transferir a…</option>
                        {usuarios.filter(u => u.id_usuario !== r.id_usuario).map(u =>
                          <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>)}
                      </select>
                    </>) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Nuevo préstamo ---------- */
function NuevoPrestamo({ usuarios, libros, aviso, refrescar }) {
  const [usuario, setUsuario] = useState('');
  const [sel, setSel] = useState([]);
  const toggle = id => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const enviar = async () => {
    try {
      const r = await api('/api/prestamos', 'POST', { id_usuario: parseInt(usuario), libros: sel });
      aviso('ok', `Préstamo #${r.id_prestamo} registrado (COMMIT)`);
      setSel([]); setUsuario('');
    } catch (e) { aviso('err', e.message, e.rollback); }
    refrescar();
  };

  return (
    <section>
      <h2>Registrar préstamo</h2>
      <p className="nota">Se ejecuta en una <b>transacción</b>: crea el préstamo, descuenta stock y guarda el detalle.
        Si algún libro no tiene stock, se hace <b>ROLLBACK</b> y no se guarda nada.</p>
      <label>Usuario
        <select value={usuario} onChange={e => setUsuario(e.target.value)}>
          <option value="">Selecciona…</option>
          {usuarios.map(u => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>Libros</legend>
        {libros.map(l => (
          <label key={l.id_libro} className="check">
            <input type="checkbox" checked={sel.includes(l.id_libro)} onChange={() => toggle(l.id_libro)} />
            <span>{l.titulo} <small>{l.autor}</small></span>
            <em className={l.stock === 0 ? 'sin' : ''}>{l.stock === 0 ? 'sin stock' : `stock ${l.stock}`}</em>
          </label>
        ))}
      </fieldset>
      <button className="primario" disabled={!usuario || !sel.length} onClick={enviar}>Registrar préstamo</button>
    </section>
  );
}

/* ---------- Libros / Usuarios ---------- */
function Libros({ libros, aviso, refrescar }) {
  const [f, setF] = useState({ titulo: '', autor: '', stock: 1 });
  const guardar = async e => {
    e.preventDefault();
    try { await api('/api/libros', 'POST', f); aviso('ok', 'Libro agregado'); setF({ titulo: '', autor: '', stock: 1 }); }
    catch (er) { aviso('err', er.message); }
    refrescar();
  };
  return (
    <section>
      <h2>Libros</h2>
      <form className="fila" onSubmit={guardar}>
        <input placeholder="Título" value={f.titulo} onChange={e => setF({ ...f, titulo: e.target.value })} />
        <input placeholder="Autor" value={f.autor} onChange={e => setF({ ...f, autor: e.target.value })} />
        <input type="number" min="0" style={{ width: 90 }} value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} />
        <button className="primario">Agregar libro</button>
      </form>
      <Tabla rows={libros} />
    </section>
  );
}
function Usuarios({ usuarios, aviso, refrescar }) {
  const [f, setF] = useState({ nombre: '', telefono: '' });
  const guardar = async e => {
    e.preventDefault();
    try { await api('/api/usuarios', 'POST', f); aviso('ok', 'Usuario agregado'); setF({ nombre: '', telefono: '' }); }
    catch (er) { aviso('err', er.message); }
    refrescar();
  };
  return (
    <section>
      <h2>Usuarios</h2>
      <form className="fila" onSubmit={guardar}>
        <input placeholder="Nombre" value={f.nombre} onChange={e => setF({ ...f, nombre: e.target.value })} />
        <input placeholder="Teléfono" value={f.telefono} onChange={e => setF({ ...f, telefono: e.target.value })} />
        <button className="primario">Agregar usuario</button>
      </form>
      <Tabla rows={usuarios} />
    </section>
  );
}

/* ---------- Reportes ---------- */
function Reportes() {
  const [lista, setLista] = useState([]);
  const [data, setData] = useState(null);
  useEffect(() => { api('/api/reportes').then(l => { setLista(l); if (l[0]) abrir(l[0].id); }); }, []);
  const abrir = id => api('/api/reportes/' + id).then(setData);
  return (
    <section>
      <h2>Reportes con JOIN</h2>
      <div className="chips">{lista.map(r => <button key={r.id} onClick={() => abrir(r.id)}>{r.titulo}</button>)}</div>
      {data && (<>
        <h3>{data.titulo}</h3>
        <pre>{data.sql}</pre>
        <Tabla rows={data.rows} />
      </>)}
    </section>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [tab, setTab] = useState('prestamos');
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [msg, setMsg] = useState(null);
  const [version, setVersion] = useState(0);

  const refrescar = useCallback(() => {
    api('/api/usuarios').then(setUsuarios);
    api('/api/libros').then(setLibros);
    setVersion(v => v + 1);
  }, []);
  useEffect(() => { refrescar(); }, [refrescar]);

  const aviso = (tipo, texto, rollback) => {
    setMsg({ tipo, texto: rollback ? `${texto}  → ROLLBACK ejecutado` : texto });
    setTimeout(() => setMsg(null), 6000);
  };

  const tabs = [['prestamos', 'Préstamos'], ['nuevo', 'Nuevo préstamo'], ['libros', 'Libros'], ['usuarios', 'Usuarios'], ['reportes', 'Reportes']];
  return (
    <div className="app">
      <header>
        <h1>Biblioteca</h1>
        <nav>{tabs.map(([k, n]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}</nav>
      </header>
      {msg && <div className={'toast ' + msg.tipo} role="status">{msg.texto}</div>}
      <main>
        {tab === 'prestamos' && <Prestamos key={version} usuarios={usuarios} aviso={aviso} refrescar={refrescar} />}
        {tab === 'nuevo' && <NuevoPrestamo usuarios={usuarios} libros={libros} aviso={aviso} refrescar={refrescar} />}
        {tab === 'libros' && <Libros libros={libros} aviso={aviso} refrescar={refrescar} />}
        {tab === 'usuarios' && <Usuarios usuarios={usuarios} aviso={aviso} refrescar={refrescar} />}
        {tab === 'reportes' && <Reportes />}
      </main>
    </div>
  );
}

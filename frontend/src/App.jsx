import { useEffect, useState, useCallback, useMemo } from 'react';

async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const e = new Error(data.error || 'Error');
    e.rollback = data.rollback;
    throw e;
  }
  return data;
}

const fmt = d => (d ? String(d).slice(0, 10) : '—');

function Tabla({ rows }) {
  if (!rows || !rows.length) return <p className="vacio">No hay datos todavía.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c}>{c.replaceAll('_', ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map(c => (
                <td key={c}>
                  {c.startsWith('fecha') ? fmt(r[c]) : String(r[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Préstamos ---------- */
function Prestamos({ usuarios, aviso, refrescar }) {
  const [rows, setRows] = useState([]);
  const cargar = useCallback(() => api('/api/prestamos').then(setRows), []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const devolver = async id => {
    try {
      await api(`/api/prestamos/${id}/devolver`, 'PUT');
      aviso('ok', `Préstamo #${id} devuelto con éxito (COMMIT)`);
    } catch (e) {
      aviso('err', e.message, e.rollback);
    }
    cargar();
    refrescar();
  };

  const transferir = async (id, dest) => {
    if (!dest) return;
    try {
      await api(`/api/prestamos/${id}/transferir`, 'PUT', { id_usuario_destino: parseInt(dest) });
      aviso('ok', `Préstamo #${id} transferido con éxito (COMMIT)`);
    } catch (e) {
      aviso('err', e.message, e.rollback);
    }
    cargar();
  };

  return (
    <section>
      <h2>Préstamos Registrados</h2>
      <p className="nota">
        Consulta relacional con <b>INNER JOIN</b> entre <i>Prestamos</i>, <i>Usuarios</i>, <i>Detalle_Prestamo</i> y <i>Libros</i>.
      </p>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th># ID</th>
              <th>Usuario</th>
              <th>Libro</th>
              <th>Fecha Salida</th>
              <th>Fecha Devolución</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const activo = !r.fecha_devolucion;
              return (
                <tr key={r.id_prestamo + '-' + r.titulo}>
                  <td><b>#{r.id_prestamo}</b></td>
                  <td>{r.usuario}</td>
                  <td>
                    {r.titulo}
                    <small>{r.autor}</small>
                  </td>
                  <td>{fmt(r.fecha_salida)}</td>
                  <td>{fmt(r.fecha_devolucion)}</td>
                  <td>
                    <span className={'tag ' + (activo ? 'activo' : 'hecho')}>
                      {r.estado_libro}
                    </span>
                  </td>
                  <td className="acciones">
                    {activo ? (
                      <>
                        <button onClick={() => devolver(r.id_prestamo)}>Devolver</button>
                        <select
                          value=""
                          onChange={e => transferir(r.id_prestamo, e.target.value)}
                        >
                          <option value="">Transferir a…</option>
                          {usuarios
                            .filter(u => u.id_usuario !== r.id_usuario)
                            .map(u => (
                              <option key={u.id_usuario} value={u.id_usuario}>
                                {u.nombre}
                              </option>
                            ))}
                        </select>
                      </>
                    ) : (
                      '—'
                    )}
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
  const toggle = id =>
    setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const enviar = async () => {
    try {
      const r = await api('/api/prestamos', 'POST', {
        id_usuario: parseInt(usuario),
        libros: sel,
      });
      aviso('ok', `Préstamo #${r.id_prestamo} registrado con éxito (COMMIT)`);
      setSel([]);
      setUsuario('');
    } catch (e) {
      aviso('err', e.message, e.rollback);
    }
    refrescar();
  };

  return (
    <section>
      <h2>Registrar Nuevo Préstamo</h2>
      <p className="nota">
        Se ejecuta en una <b>transacción atómica</b>: crea el préstamo, descuenta stock y guarda el detalle.
        Si algún libro no tiene stock disponible, se ejecuta un <b>ROLLBACK</b> automático y no se persiste ningún cambio.
      </p>
      <label>
        Usuario Solicitante
        <select value={usuario} onChange={e => setUsuario(e.target.value)}>
          <option value="">Selecciona un usuario…</option>
          {usuarios.map(u => (
            <option key={u.id_usuario} value={u.id_usuario}>
              {u.nombre}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Selección de Libros</legend>
        {libros.map(l => (
          <label key={l.id_libro} className="check">
            <input
              type="checkbox"
              disabled={l.stock === 0}
              checked={sel.includes(l.id_libro)}
              onChange={() => toggle(l.id_libro)}
            />
            <span>
              {l.titulo} <small>{l.autor}</small>
            </span>
            <em className={l.stock === 0 ? 'sin' : ''}>
              {l.stock === 0 ? 'Agotado (0)' : `Stock: ${l.stock}`}
            </em>
          </label>
        ))}
      </fieldset>
      <button
        className="primario"
        disabled={!usuario || !sel.length}
        onClick={enviar}
      >
        Confirmar y Registrar Préstamo
      </button>
    </section>
  );
}

/* ---------- Libros / Usuarios ---------- */
function Libros({ libros, aviso, refrescar }) {
  const [f, setF] = useState({ titulo: '', autor: '', stock: 1 });
  const guardar = async e => {
    e.preventDefault();
    try {
      await api('/api/libros', 'POST', f);
      aviso('ok', 'Libro agregado al catálogo');
      setF({ titulo: '', autor: '', stock: 1 });
    } catch (er) {
      aviso('err', er.message);
    }
    refrescar();
  };
  return (
    <section>
      <h2>Catálogo de Libros</h2>
      <form className="fila" onSubmit={guardar}>
        <input
          placeholder="Título del libro"
          value={f.titulo}
          onChange={e => setF({ ...f, titulo: e.target.value })}
        />
        <input
          placeholder="Autor"
          value={f.autor}
          onChange={e => setF({ ...f, autor: e.target.value })}
        />
        <input
          type="number"
          min="0"
          style={{ width: 100 }}
          value={f.stock}
          onChange={e => setF({ ...f, stock: e.target.value })}
        />
        <button className="primario">+ Agregar libro</button>
      </form>
      <Tabla rows={libros} />
    </section>
  );
}

function Usuarios({ usuarios, aviso, refrescar }) {
  const [f, setF] = useState({ nombre: '', telefono: '' });
  const guardar = async e => {
    e.preventDefault();
    try {
      await api('/api/usuarios', 'POST', f);
      aviso('ok', 'Usuario registrado con éxito');
      setF({ nombre: '', telefono: '' });
    } catch (er) {
      aviso('err', er.message);
    }
    refrescar();
  };
  return (
    <section>
      <h2>Directorio de Usuarios</h2>
      <form className="fila" onSubmit={guardar}>
        <input
          placeholder="Nombre completo"
          value={f.nombre}
          onChange={e => setF({ ...f, nombre: e.target.value })}
        />
        <input
          placeholder="Teléfono de contacto"
          value={f.telefono}
          onChange={e => setF({ ...f, telefono: e.target.value })}
        />
        <button className="primario">+ Agregar usuario</button>
      </form>
      <Tabla rows={usuarios} />
    </section>
  );
}

/* ---------- Reportes ---------- */
function Reportes() {
  const [lista, setLista] = useState([]);
  const [data, setData] = useState(null);
  useEffect(() => {
    api('/api/reportes').then(l => {
      setLista(l);
      if (l && l[0]) abrir(l[0].id);
    });
  }, []);
  const abrir = id => api('/api/reportes/' + id).then(setData);
  return (
    <section>
      <h2>Reportes y Consultas SQL</h2>
      <div className="chips">
        {lista.map(r => (
          <button key={r.id} onClick={() => abrir(r.id)}>
            {r.titulo}
          </button>
        ))}
      </div>
      {data && (
        <>
          <h3>{data.titulo}</h3>
          <pre>{data.sql}</pre>
          <Tabla rows={data.rows} />
        </>
      )}
    </section>
  );
}

/* ---------- App Principal ---------- */
export default function App() {
  const [tab, setTab] = useState('prestamos');
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [msg, setMsg] = useState(null);
  const [version, setVersion] = useState(0);

  const refrescar = useCallback(() => {
    api('/api/usuarios').then(setUsuarios).catch(() => {});
    api('/api/libros').then(setLibros).catch(() => {});
    api('/api/prestamos').then(setPrestamos).catch(() => {});
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const aviso = (tipo, texto, rollback) => {
    setMsg({ tipo, texto: rollback ? `${texto} → ROLLBACK ejecutado` : texto });
    setTimeout(() => setMsg(null), 6000);
  };

  // Cálculos para KPIs rápidos
  const stats = useMemo(() => {
    const activos = prestamos.filter(p => !p.fecha_devolucion).length;
    const stockTotal = libros.reduce((acc, l) => acc + (l.stock || 0), 0);
    const stockBajo = libros.filter(l => (l.stock || 0) <= 1).length;
    return {
      activos,
      stockTotal,
      stockBajo,
      totalLectores: usuarios.length,
    };
  }, [prestamos, libros, usuarios]);

  const tabs = [
    ['prestamos', '1. Préstamos Activos'],
    ['nuevo', '2. Nuevo Préstamo (Atómico)'],
    ['libros', '3. Catálogo de Libros'],
    ['usuarios', '4. Directorio de Usuarios'],
    ['reportes', '5. Reportes SQL'],
  ];

  return (
    <div className="app">
      {/* HEADER INSTITUCIONAL CORREGIDO */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-group">
            {/* Logos con contenedor blanco para máximo contraste */}
            <div className="logo-badge">
              <img
                src="/escudo-uagrm.png"
                alt="Escudo UAGRM"
                className="logo-img"
              />
              <span className="logo-divider" />
              <img
                src="/logo-fini.png"
                alt="Facultad Integral del Ichilo"
                className="logo-img"
              />
            </div>

            {/* Jerarquía de títulos institucionales */}
            <div className="brand-info">
              <div className="brand-pill-row">
                <span className="brand-pill">UAGRM · FINI</span>
                <span className="brand-ver">v4.2</span>
              </div>
              <h1 className="brand-title">BIBLIOTECA FACULTATIVA</h1>
              <p className="brand-subtitle">
                Sede Yapacaní · Sistema Registral y Circulación
              </p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <nav className="header-nav">
            {tabs.map(([k, n]) => (
              <button
                key={k}
                className={tab === k ? 'on' : ''}
                onClick={() => setTab(k)}
              >
                {n}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Alertas Toast */}
      {msg && (
        <div className={'toast ' + msg.tipo} role="status">
          {msg.texto}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main>
        {/* KPI CARDS (RESUMEN EN TIEMPO REAL) */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-title">Préstamos Activos</span>
            <div className="kpi-value-row">
              <span className="kpi-number">{stats.activos}</span>
              <span className="kpi-badge info">En curso</span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Ejemplares Disponibles</span>
            <div className="kpi-value-row">
              <span className="kpi-number">{stats.stockTotal}</span>
              <span className="kpi-badge ok">En stock</span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Lectores Registrados</span>
            <div className="kpi-value-row">
              <span className="kpi-number">{stats.totalLectores}</span>
              <span className="kpi-badge info">Habilitados</span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Stock Crítico (≤ 1)</span>
            <div className="kpi-value-row">
              <span className={`kpi-number ${stats.stockBajo > 0 ? 'alerta' : ''}`}>
                {stats.stockBajo}
              </span>
              <span className={`kpi-badge ${stats.stockBajo > 0 ? 'alerta' : 'ok'}`}>
                {stats.stockBajo > 0 ? 'Alerta' : 'Óptimo'}
              </span>
            </div>
          </div>
        </div>

        {/* CONTENIDO DE LA PESTAÑA ACTIVA */}
        {tab === 'prestamos' && (
          <Prestamos
            key={version}
            usuarios={usuarios}
            aviso={aviso}
            refrescar={refrescar}
          />
        )}
        {tab === 'nuevo' && (
          <NuevoPrestamo
            usuarios={usuarios}
            libros={libros}
            aviso={aviso}
            refrescar={refrescar}
          />
        )}
        {tab === 'libros' && (
          <Libros
            libros={libros}
            aviso={aviso}
            refrescar={refrescar}
          />
        )}
        {tab === 'usuarios' && (
          <Usuarios
            usuarios={usuarios}
            aviso={aviso}
            refrescar={refrescar}
          />
        )}
        {tab === 'reportes' && <Reportes />}
      </main>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <img src="/logo-fini.png" alt="FINI" className="footer-logo" />
            <div>
              <strong>FACULTAD INTEGRAL DEL ICHILO (FINI)</strong>
              <p>
                Universidad Autónoma Gabriel René Moreno · Sede Central Yapacaní, Santa Cruz - Bolivia
              </p>
            </div>
          </div>
          <div className="footer-right">
            <p>BiblioTech · Módulo de Circulación y Kardex Bibliotecario</p>
            <small>© 2026 Universidad Autónoma Gabriel René Moreno. Todos los derechos reservados.</small>
          </div>
        </div>
      </footer>
    </div>
  );
}

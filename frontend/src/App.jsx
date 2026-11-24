import { useEffect, useState, useCallback, useMemo } from 'react';
import SplitText from './components/SplitText';
import ScrollExpand from './components/ScrollExpand';
import ThemeSwitch from './components/ThemeSwitch';
import Portada from './components/Portada';
import { normalizar } from './portadas';

function temaInicial() {
  try {
    const guardado = localStorage.getItem('tema');
    if (guardado) return guardado === 'oscuro';
  } catch { }
  return false;
}

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

// Reduce una imagen (dataURL) a máx. 1600 px por lado, para que se suba rápido
function reducirImagen(dataUrl, max = 1600) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const fmt = d =>(d ? String(d).slice(0, 10) : '—');

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
      aviso('ok', `Préstamo #${id} devuelto con éxito`);
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
      aviso('ok', `Préstamo #${id} transferido con éxito`);
    } catch (e) {
      aviso('err', e.message, e.rollback);
    }
    cargar();
  };

  return (
    <section>
      <h2>Préstamos Registrados</h2>
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
                    <div className="libro-celda">
                      <Portada titulo={r.titulo} autor={r.autor} mini portada_url={r.portada_url} />
                      <div>
                        {r.titulo}
                        <small>{r.autor}</small>
                      </div>
                    </div>
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
      aviso('ok', `Préstamo #${r.id_prestamo} registrado con éxito`);
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
            <Portada titulo={l.titulo} autor={l.autor} mini portada_url={l.portada_url} className="check-portada" />
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
  const [f, setF] = useState({ titulo: '', autor: '', stock: 1, imagen_base64: '' });
  const [cargando, setCargando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [nuevo, setNuevo] = useState(false);
  const visibles = useMemo(() => {
    const t = normalizar(q);
    return t
      ? libros.filter(l => normalizar(l.titulo + ' ' + l.autor).includes(t))
      : libros;
  }, [libros, q]);

  useEffect(() => {
    if (!abierto) return;
    const esc = e => e.key === 'Escape' && setAbierto(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [abierto]);

  useEffect(() => {
    if (!nuevo) return;
    const esc = e => e.key === 'Escape' && !cargando && cerrarNuevo();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  });

  const cerrarNuevo = () => {
    setNuevo(false);
    setF({ titulo: '', autor: '', stock: 1, imagen_base64: '', portada_url: '' });
    setPreview(null);
  };

  // Detectar si el título actual coincide con un libro existente en el catálogo
  const libroExistente = useMemo(() => {
    const t = normalizar(f.titulo);
    if (!t) return null;
    return libros.find(l => normalizar(l.titulo) === t) || null;
  }, [libros, f.titulo]);

  const onTituloChange = e => {
    const val = e.target.value;
    const match = libros.find(l => normalizar(l.titulo) === normalizar(val));
    if (match) {
      setF(prev => ({
        ...prev,
        titulo: match.titulo,
        autor: match.autor || '',
        portada_url: match.portada_url || '',
      }));
      setPreview(match.portada_url || null);
    } else {
      setF(prev => ({
        ...prev,
        titulo: val,
      }));
    }
  };

  const onSeleccionarImagen = e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      aviso('err', 'Formato no válido. Usa JPG, PNG o WebP');
      return;
    }
    const reader = new FileReader();
    reader.onload = async ev => {
      let data = ev.target.result;
      // Sin límite de tamaño: las fotos muy pesadas se reducen solas antes de enviarlas
      if (file.size > 2 * 1024 * 1024) data = await reducirImagen(data);
      setPreview(data);
      setF(prev => ({ ...prev, imagen_base64: data }));
    };
    reader.readAsDataURL(file);
  };

  const quitarImagen = () => {
    setPreview(null);
    setF(prev => ({ ...prev, imagen_base64: '' }));
  };

  const guardar = async e => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await api('/api/libros', 'POST', f);
      aviso('ok', res.mensaje || (f.imagen_base64 ? 'Libro agregado con portada en Cloudinary ☁️' : 'Libro guardado con éxito'));
      cerrarNuevo();
    } catch (er) {
      aviso('err', er.message);
    } finally {
      setCargando(false);
    }
    refrescar();
  };
  return (
    <div className="catalogo-wrapper">
      <div className="catalogo-banner">
        <div className="catalogo-banner-info">
          <span className="catalogo-eyebrow">COLECCIÓN INSTITUCIONAL</span>
          <h2 className="catalogo-titulo">Catálogo de libros</h2>
          <p className="catalogo-desc">
            Consulta la colección, revisa existencias y registra nuevos ejemplares con su portada.
          </p>
        </div>
        <button className="primario btn-agregar" onClick={() => setNuevo(true)}>
          + Agregar libro
        </button>
      </div>

      <section className="catalogo-contenido">

      {nuevo && (
        <div className="visor" onClick={() => !cargando && cerrarNuevo()} role="dialog" aria-modal="true" aria-labelledby="nuevo-libro-titulo">
          <form className="modal-libro" onClick={e => e.stopPropagation()} onSubmit={guardar}>
            <div className="modal-libro-head">
              <div>
                <span className="catalogo-eyebrow">
                  {libroExistente ? `Libro existente · ${libroExistente.stock} disp. actuales` : 'Nuevo registro'}
                </span>
                <h3 id="nuevo-libro-titulo">
                  {libroExistente ? 'Aumentar stock disponible' : 'Agregar libro al catálogo'}
                </h3>
              </div>
              <button type="button" className="modal-libro-cerrar" onClick={cerrarNuevo} disabled={cargando} aria-label="Cerrar">×</button>
            </div>

            <div className="modal-libro-body">
              <div className="modal-libro-portada">
                <Portada
                  titulo={f.titulo || 'Título del libro'}
                  autor={f.autor || (libroExistente ? libroExistente.autor : 'Nombre del autor')}
                  portada_url={preview || (libroExistente ? libroExistente.portada_url : null)}
                />
                {libroExistente ? (
                  <span className="badge-portada-fija">✓ Portada del catálogo</span>
                ) : preview ? (
                  <div className="modal-libro-acciones-img">
                    <label className="btn-upload-portada">
                      Cambiar
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onSeleccionarImagen} hidden />
                    </label>
                    <button type="button" className="btn-quitar-portada" onClick={quitarImagen}>Quitar</button>
                  </div>
                ) : (
                  <label className="btn-upload-portada">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Subir portada
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onSeleccionarImagen} hidden />
                  </label>
                )}
                {!libroExistente && <small>JPG, PNG o WebP</small>}
              </div>

              <div className="modal-libro-campos">
                <label>
                  Título del libro
                  <input
                    autoFocus
                    placeholder="Escribe o selecciona un título…"
                    value={f.titulo}
                    onChange={onTituloChange}
                    list="titulos-catalogo-sugerencias"
                    required
                  />
                  <datalist id="titulos-catalogo-sugerencias">
                    {libros.map(l => (
                      <option key={l.id_libro} value={l.titulo}>
                        {l.autor ? `de ${l.autor} (${l.stock} disp.)` : `(${l.stock} disp.)`}
                      </option>
                    ))}
                  </datalist>
                </label>

                <label>
                  Autor
                  <input
                    placeholder="Nombre completo"
                    value={f.autor}
                    onChange={e => setF({ ...f, autor: e.target.value })}
                    disabled={!!libroExistente}
                    className={libroExistente ? 'campo-bloqueado' : ''}
                  />
                  {libroExistente && (
                    <small className="campo-nota-auto">🔒 Autocompletado del catálogo existente</small>
                  )}
                </label>

                <label>
                  {libroExistente ? 'Libros disponibles a sumar (+)' : 'Libros disponibles'}
                  <input
                    type="number"
                    min="1"
                    value={f.stock}
                    onChange={e => setF({ ...f, stock: e.target.value })}
                    required
                  />
                  {libroExistente && (
                    <small className="campo-nota-stock">
                      Se sumará a los <b>{libroExistente.stock}</b> actuales (Resultante: <b>{(libroExistente.stock || 0) + (parseInt(f.stock) || 0)}</b> disponibles)
                    </small>
                  )}
                </label>

                <div className="modal-libro-pie">
                  <button type="button" className="btn-cancelar" onClick={cerrarNuevo} disabled={cargando}>
                    Cancelar
                  </button>
                  <button className="primario" disabled={cargando}>
                    {cargando
                      ? 'Guardando…'
                      : libroExistente
                      ? `+ Sumar ${f.stock || 1} al stock`
                      : '+ Guardar libro'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="estante-barra">
        <input
          type="search"
          placeholder="🔍 Buscar por título o autor…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <span>{visibles.length} de {libros.length} títulos</span>
      </div>

      {visibles.length ? (
        <div className="estante">
          {visibles.map(l => (
            <button key={l.id_libro} className="libro-card" onClick={() => setAbierto(l)}>
              <div className="libro-3d">
                <Portada titulo={l.titulo} autor={l.autor} portada_url={l.portada_url} />
                <span className={'libro-stock ' + (l.stock === 0 ? 'sin' : l.stock <= 1 ? 'bajo' : '')}>
                  {l.stock === 0 ? 'Agotado' : `${l.stock} disp.`}
                </span>
              </div>
              <strong>{l.titulo}</strong>
              <small>{l.autor}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="vacio">No hay libros que coincidan.</p>
      )}

      {abierto && (
        <div className="visor" onClick={() => setAbierto(null)} role="dialog" aria-modal="true">
          <div className="visor-caja" onClick={e => e.stopPropagation()}>
            <button className="visor-cerrar" onClick={() => setAbierto(null)} aria-label="Cerrar">×</button>
            <div className="visor-portada">
              <Portada titulo={abierto.titulo} autor={abierto.autor} portada_url={abierto.portada_url} />
            </div>
            <div className="visor-info">
              <span className="brand-pill">Libro #{abierto.id_libro}</span>
              <h3>{abierto.titulo}</h3>
              <p>{abierto.autor}</p>
              <span className={'tag ' + (abierto.stock > 0 ? 'hecho' : 'activo')}>
                {abierto.stock > 0
                  ? `${abierto.stock} ejemplar${abierto.stock === 1 ? '' : 'es'} disponible${abierto.stock === 1 ? '' : 's'}`
                  : 'Sin ejemplares disponibles'}
              </span>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
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
      <h2>Reportes y Consultas</h2>
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
          <Tabla rows={data.rows} />
        </>
      )}
    </section>
  );
}

/* ---------- Inicio / Portada Institucional ---------- */
function Inicio({ setTab }) {
  return (
    <div className="inicio-view">
      <div className="scroll-expand-container">
        <ScrollExpand
          src="/hero.jpg"
          alt="Biblioteca Facultativa FINI Yapacaní"
          title="BIBLIOTECA FINI"
          scrollHint="Desliza para explorar la biblioteca ↓"
          mediaZoom={1.25}
          startWidth={48}
          startHeight={64}
          startRadius={24}
        >
          <div className="hero-expanded-content">
            <span className="hero-pill">UAGRM · FACULTAD INTEGRAL DEL ICHILO</span>
            <h2 className="hero-title">Sistema de Circulación y Kardex Bibliotecario</h2>
            <p className="hero-desc">
              Bienvenido al portal bibliotecario de la Sede Central Yapacaní. Consulta
              disponibilidad de títulos, gestiona tus préstamos a domicilio y revisa las fechas
              de devolución en tiempo real.
            </p>
            <div className="hero-actions">
              <button className="primario hero-btn" onClick={() => setTab('prestamos')}>
                Explorar Préstamos Activos →
              </button>
              <button className="hero-btn-sec" onClick={() => setTab('nuevo')}>
                + Solicitar Préstamo
              </button>
            </div>
          </div>
        </ScrollExpand>
      </div>

      <div className="inicio-cards-grid">
        <div className="info-card">
          <div className="info-icon">🕒</div>
          <h3>Horario de Atención</h3>
          <p>Lunes a Viernes</p>
          <strong>08:00 - 12:00 | 14:00 - 18:00</strong>
          <small>Atención presencial en sala y préstamos externos para estudiantes.</small>
        </div>

        <div className="info-card">
          <div className="info-icon">📍</div>
          <h3>Ubicación</h3>
          <p>Campus Universitario FINI</p>
          <strong>Sede Central Yapacaní</strong>
          <small>Facultad Integral del Ichilo · Santa Cruz de la Sierra - Bolivia</small>
        </div>

        <div className="info-card">
          <div className="info-icon">📜</div>
          <h3>Condiciones de Préstamo</h3>
          <p>Préstamo a domicilio por 7 días</p>
          <strong>Solvencia sin multas</strong>
          <small>Presentar carnet universitario vigente o documento de identidad.</small>
        </div>
      </div>
    </div>
  );
}

/* ---------- App Principal ---------- */
export default function App() {
  const [tab, setTab] = useState('inicio');
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [msg, setMsg] = useState(null);
  const [version, setVersion] = useState(0);
  const [oscuro, setOscuro] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro);
    try {
      localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro');
    } catch { }
  }, [oscuro]);

  const refrescar = useCallback(() => {
    api('/api/usuarios').then(setUsuarios).catch(() => { });
    api('/api/libros').then(setLibros).catch(() => { });
    api('/api/prestamos').then(setPrestamos).catch(() => { });
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const aviso = (tipo, texto, rollback) => {
    setMsg({ tipo, texto: rollback ? `${texto} — operación revertida` : texto });
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
    ['inicio', '🏛️ Inicio'],
    ['prestamos', '1. Préstamos Activos'],
    ['nuevo', '2. Nuevo Préstamo'],
    ['libros', '3. Catálogo de Libros'],
    ['usuarios', '4. Directorio de Usuarios'],
    ['reportes', '5. Reportes'],
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
              <h1 className="brand-title">
                <SplitText
                  text="BIBLIOTECA FACULTATIVA"
                  delay={35}
                  duration={0.6}
                  ease="power3.out"
                />
              </h1>
              <p className="brand-subtitle">
                Sede Yapacaní · Sistema Registral y Circulación
              </p>
            </div>
          </div>

          {/* Navegación por pestañas + selector de tema */}
          <div className="header-right">
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
            <ThemeSwitch checked={oscuro} onChange={setOscuro} />
          </div>
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
        {tab === 'inicio' && <Inicio setTab={setTab} />}
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

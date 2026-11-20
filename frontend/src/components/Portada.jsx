import { buscarPortada, normalizar } from '../portadas';
import './Portada.css';

const TEMAS_AUTO = ['noche', 'selva', 'mancha', 'vigilancia', 'tiza', 'cuartel', 'vino'];

function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/* ---------- Ilustraciones vectoriales (viewBox 200x140) ---------- */
const Mariposa = ({ x, y, s = 1, r = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path d="M0 0 C-12 -14 -20 -2 -10 4 C-18 10 -8 18 0 6 Z" fill="#facc15" />
    <path d="M0 0 C12 -14 20 -2 10 4 C18 10 8 18 0 6 Z" fill="#fde047" />
    <line x1="0" y1="-4" x2="0" y2="8" stroke="#3f2d0c" strokeWidth="1.6" />
  </g>
);

function Ilustracion({ tipo }) {
  switch (tipo) {
    case 'mariposas':
      return (
        <svg viewBox="0 0 200 140" aria-hidden="true">
          <path d="M100 140 C96 110 98 90 92 70 M100 140 C104 110 106 92 116 74 M96 96 C80 88 70 90 58 84 M104 100 C120 92 132 94 146 88"
            stroke="#3b2a1a" strokeWidth="7" fill="none" strokeLinecap="round" />
          <ellipse cx="100" cy="56" rx="62" ry="38" fill="#14532d" />
          <ellipse cx="72" cy="66" rx="34" ry="22" fill="#166534" />
          <ellipse cx="130" cy="64" rx="36" ry="24" fill="#15803d" />
          <Mariposa x={40} y={30} s={1.1} r={-20} />
          <Mariposa x={160} y={26} s={0.9} r={18} />
          <Mariposa x={150} y={100} s={1.2} r={-8} />
          <Mariposa x={34} y={104} s={0.8} r={25} />
          <Mariposa x={100} y={18} s={0.7} r={5} />
          <Mariposa x={118} y={58} s={0.6} r={-30} />
        </svg>
      );
    case 'planeta':
      return (
        <svg viewBox="0 0 200 140" aria-hidden="true">
          {[[20, 20], [170, 16], [150, 50], [30, 70], [182, 92], [60, 12], [120, 8]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 1.4 : 2.2} fill="#fef9c3" />
          ))}
          <circle cx="160" cy="34" r="12" fill="#fde68a" />
          <circle cx="155" cy="30" r="12" fill="#1e1b4b" />
          <circle cx="100" cy="126" r="58" fill="#f59e0b" />
          <circle cx="78" cy="110" r="6" fill="#d97706" />
          <circle cx="124" cy="132" r="9" fill="#d97706" />
          {/* principito */}
          <rect x="94" y="48" width="12" height="22" rx="4" fill="#16a34a" />
          <circle cx="100" cy="42" r="7" fill="#fde7c7" />
          <path d="M93 38 L96 32 L99 37 L102 31 L105 37 L108 33 L107 40 Z" fill="#facc15" />
          <path d="M106 52 C120 50 128 44 136 40 C128 50 118 56 106 58 Z" fill="#facc15" />
          <rect x="95" y="70" width="4" height="10" fill="#14532d" />
          <rect x="101" y="70" width="4" height="10" fill="#14532d" />
          {/* rosa */}
          <line x1="132" y1="78" x2="132" y2="64" stroke="#15803d" strokeWidth="2" />
          <circle cx="132" cy="61" r="5" fill="#e11d48" />
        </svg>
      );
    case 'molino':
      return (
        <svg viewBox="0 0 200 140" aria-hidden="true">
          <circle cx="40" cy="32" r="16" fill="#fde047" />
          <path d="M0 120 C50 100 120 104 200 116 L200 140 L0 140 Z" fill="#a16207" />
          <path d="M118 112 L126 56 L146 56 L154 112 Z" fill="#f5f5f4" />
          <path d="M122 58 L136 42 L150 58 Z" fill="#7c2d12" />
          <g transform="translate(136 58)">
            <g className="aspas">
              {[0, 90, 180, 270].map(a => (
                <rect key={a} x="-4" y="-50" width="8" height="46" fill="#57534e"
                  stroke="#e7e5e4" strokeWidth="1" transform={`rotate(${a + 20})`} />
              ))}
            </g>
            <circle r="4" fill="#292524" />
          </g>
          {/* caballero con lanza */}
          <path d="M36 112 L44 96 L54 96 L60 112" stroke="#292524" strokeWidth="4" fill="none" />
          <ellipse cx="50" cy="94" rx="14" ry="6" fill="#78716c" />
          <rect x="47" y="76" width="7" height="16" fill="#9ca3af" />
          <circle cx="50" cy="72" r="5" fill="#d6d3d1" />
          <line x1="52" y1="82" x2="110" y2="64" stroke="#451a03" strokeWidth="2.5" />
        </svg>
      );
    case 'ojo':
      return (
        <svg viewBox="0 0 200 140" aria-hidden="true">
          <rect x="30" y="14" width="140" height="112" rx="14" fill="#18181b" stroke="#3f3f46" strokeWidth="4" />
          <path d="M44 70 C70 32 130 32 156 70 C130 108 70 108 44 70 Z" fill="#f4f4f5" />
          <circle cx="100" cy="70" r="22" fill="#b91c1c" />
          <circle cx="100" cy="70" r="10" fill="#0a0a0a" />
          <circle cx="94" cy="64" r="4" fill="#fff" />
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={i} x1="34" x2="166" y1={20 + i * 8} y2={20 + i * 8} stroke="#000" strokeOpacity=".22" />
          ))}
          <rect x="60" y="126" width="80" height="8" fill="#3f3f46" />
        </svg>
      );
    case 'rayuela': {
      const casillas = [
        [80, 112, '1'], [80, 90, '2'], [80, 68, '3'], [60, 46, '4'], [100, 46, '5'],
        [80, 24, '6'],
      ];
      return (
        <svg viewBox="0 0 200 140" aria-hidden="true">
          {casillas.map(([x, y, n]) => (
            <g key={n}>
              <rect x={x} y={y} width="40" height="22" fill="none" stroke="#f8fafc" strokeWidth="2.5" strokeDasharray="3 1" />
              <text x={x + 20} y={y + 16} textAnchor="middle" fill="#f8fafc" fontSize="13" fontFamily="Georgia">{n}</text>
            </g>
          ))}
          <path d="M70 24 C70 2 130 2 130 24 Z" fill="none" stroke="#f8fafc" strokeWidth="2.5" />
          <text x="100" y="19" textAnchor="middle" fill="#fde047" fontSize="10" fontFamily="Georgia">CIELO</text>
          <circle cx="146" cy="60" r="7" fill="#fb7185" />
          <path d="M150 120 l14 -6 l-3 10 z" fill="#facc15" />
        </svg>
      );
    }
    case 'perro':
      return (
        <svg viewBox="0 0 200 140" aria-hidden="true">
          <rect x="16" y="40" width="40" height="100" fill="#3f3f46" />
          <rect x="60" y="20" width="34" height="120" fill="#52525b" />
          <rect x="150" y="50" width="40" height="90" fill="#3f3f46" />
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x="68" y={30 + i * 20} width="18" height="8" fill="#fde047" opacity=".7" />
          ))}
          {/* perro */}
          <path d="M104 118 L104 96 C104 84 116 80 132 82 L150 82 L154 70 L162 70 L168 80 L176 84 L172 92 L160 92 L160 118 L152 118 L152 100 L114 100 L112 118 Z"
            fill="#1c1917" />
          <path d="M104 92 C96 86 94 78 98 72" stroke="#1c1917" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="164" cy="78" r="1.6" fill="#fde047" />
          {/* gorra militar */}
          <path d="M152 70 L170 70 L172 64 L154 62 Z" fill="#166534" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 140" aria-hidden="true">
          <path d="M100 40 C76 28 46 28 26 36 L26 116 C46 108 76 108 100 120 Z" fill="#f8fafc" />
          <path d="M100 40 C124 28 154 28 174 36 L174 116 C154 108 124 108 100 120 Z" fill="#e2e8f0" />
          {[52, 64, 76, 88].map(y => (
            <g key={y}>
              <line x1="38" x2="88" y1={y} y2={y + 3} stroke="#94a3b8" strokeWidth="2" />
              <line x1="112" x2="162" y1={y + 3} y2={y} stroke="#94a3b8" strokeWidth="2" />
            </g>
          ))}
          <path d="M100 6 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill="#fde047" />
          <path d="M150 10 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" fill="#fde047" />
          <path d="M48 12 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" fill="#fde047" />
        </svg>
      );
  }
}

function tamTitulo(t) {
  const n = t.length;
  if (n <= 6) return 'xl';
  if (n <= 15) return 'l';
  if (n <= 26) return 'm';
  return 's';
}

/**
 * Portada de un libro.
 * - Si el título tiene imagen en /public/portadas, la muestra.
 * - Si no, dibuja una portada estilo "manual de autoayuda" (clásicos con diseño propio,
 *   y cualquier libro nuevo con una portada generada a partir del título).
 * mini: versión miniatura para tablas y listas (oculta los textos pequeños).
 */
export default function Portada({ titulo, autor, mini = false, className = '' }) {
  const p = buscarPortada(titulo);
  const cls = `portada${mini ? ' mini' : ''} ${className}`;

  if (p.tipo === 'img') {
    return (
      <div className={cls + ' foto'}>
        <img src={p.src} alt={`Portada de ${titulo}`} loading="lazy" draggable="false" />
      </div>
    );
  }

  const d =
    p.tipo === 'diseno'
      ? p
      : {
          gancho: 'Si buscas algo bueno para leer...',
          titulo: titulo || 'Sin título',
          sub: 'Un manual recomendado por la Biblioteca FINI para llevar a casa durante 7 días',
          edicion: '¡Edición FINI!',
          lema: 'El libro que la biblioteca sí quiere que leas',
          tema: TEMAS_AUTO[hash(normalizar(titulo)) % TEMAS_AUTO.length],
          ilustracion: 'libro',
        };

  return (
    <div className={`${cls} dibujada tema-${d.tema}`} role="img" aria-label={`Portada de ${titulo}`}>
      <span className="p-lomo" />
      <div className="p-cuerpo">
        <div className="p-gancho">{d.gancho}</div>
        <div className={`p-titulo t-${tamTitulo(d.titulo)}`}>{d.titulo}</div>
        <div className="p-sub">{d.sub}</div>
        <div className="p-ilus">
          <Ilustracion tipo={d.ilustracion} />
        </div>
        <div className="p-autor">{autor || 'Autor desconocido'}</div>
        <div className="p-sello">
          <b>{d.edicion}</b>
          <span>{d.lema}</span>
        </div>
      </div>
      <span className="p-desgaste" />
    </div>
  );
}

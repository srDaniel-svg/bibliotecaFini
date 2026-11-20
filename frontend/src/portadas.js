// Portadas del catálogo.
// 1) PORTADAS_IMG: libros con imagen real (en /public/portadas). Se relacionan por un
//    fragmento del título, así no hace falta cambiar la base de datos.
// 2) DISENOS: portadas dibujadas para los libros clásicos que no tienen imagen.
// 3) Cualquier otro libro recibe una portada generada automáticamente (ver Portada.jsx).

export const normalizar = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const PORTADAS_IMG = [
  { clave: 'cambiate de pais', src: '/portadas/cambiate-de-pais.jpg' },
  { clave: 'devuelvele un cabezazo', src: '/portadas/devuelvele-un-cabezazo.jpg' },
  { clave: 'comprate un perro', src: '/portadas/comprate-un-perro.jpg' },
  { clave: 'ruido de motor', src: '/portadas/ruido-de-motor.jpg' },
  { clave: 'preguntas existenciales', src: '/portadas/preguntas-existenciales.jpg' },
  { clave: 'pantufla al vaso', src: '/portadas/pantufla-al-vaso.jpg' },
  { clave: 'amenizala con tu pantufla', src: '/portadas/pantufla-oscuridad.jpg' },
  { clave: 'bulbasaur', src: '/portadas/bulbasaur.jpg' },
  { clave: 'pensamientos inmortales', src: '/portadas/pensamientos-inmortales.webp' },
  { clave: 'aprueba con carisma', src: '/portadas/aprueba-con-carisma.webp' },
];

// Portadas dibujadas para los clásicos, en el mismo estilo de "autoayuda absurda".
export const DISENOS = [
  {
    clave: 'cien anos de soledad',
    gancho: 'Si en tu familia todos se llaman igual...',
    titulo: 'Cien años de soledad',
    sub: 'El manual genealógico para no confundir a ningún Aureliano durante siete generaciones',
    edicion: '¡Edición con árbol genealógico!',
    lema: 'El libro que Macondo no quiere que leas',
    tema: 'selva',
    ilustracion: 'mariposas',
  },
  {
    clave: 'el principito',
    gancho: 'Si los adultos no entienden tus dibujos...',
    titulo: 'El principito',
    sub: 'Un manual de astronomía para cuidar una rosa y dibujar boas que parecen sombreros',
    edicion: '¡Edición sin adultos!',
    lema: 'El libro que los baobabs no quieren que leas',
    tema: 'noche',
    ilustracion: 'planeta',
  },
  {
    clave: 'don quijote',
    gancho: 'Si ves gigantes donde hay molinos...',
    titulo: '¡Don Quijote de la Mancha!',
    sub: 'El método caballeresco para enfrentarte a la energía eólica con lanza y dignidad',
    edicion: '¡Edición sin armadura!',
    lema: 'El libro que los molinos no quieren que leas',
    tema: 'mancha',
    ilustracion: 'molino',
  },
  {
    clave: '1984',
    gancho: 'Si sientes que alguien te observa...',
    titulo: '1984',
    sub: 'El manual de supervivencia para cuando tu televisor te mira de vuelta',
    edicion: '¡Edición vigilada!',
    lema: 'El libro que el Gran Hermano no quiere que leas',
    tema: 'vigilancia',
    ilustracion: 'ojo',
  },
  {
    clave: 'rayuela',
    gancho: 'Si no sabes por dónde empezar...',
    titulo: '¡Rayuela!',
    sub: 'El único libro que puedes leer en el orden que te dé la gana (y nadie te puede decir nada)',
    edicion: '¡Edición salteada!',
    lema: 'El libro que los índices no quieren que leas',
    tema: 'tiza',
    ilustracion: 'rayuela',
  },
  {
    clave: 'la ciudad y los perros',
    gancho: 'Si tu colegio parece un cuartel...',
    titulo: 'La ciudad y los perros',
    sub: 'Un manual de disciplina militar para sobrevivir al Leoncio Prado sin perder la dignidad',
    edicion: '¡Edición con uniforme!',
    lema: 'El libro que los cadetes no quieren que leas',
    tema: 'cuartel',
    ilustracion: 'perro',
  },
];

export function buscarPortada(titulo) {
  const t = normalizar(titulo);
  const img = PORTADAS_IMG.find(p => t.includes(p.clave));
  if (img) return { tipo: 'img', src: img.src };
  const d = DISENOS.find(p => t.includes(p.clave));
  if (d) return { tipo: 'diseno', ...d };
  return { tipo: 'auto' };
}

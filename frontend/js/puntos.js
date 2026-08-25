/* ==========================================================================
   PUNTOS Y CUPONES · Maqueta (localStorage)
   Los puntos se ganan solo con acciones geolocalizadas. Cuando exista login
   (Supabase Auth), este módulo migra a la tabla ph_puntos sin cambiar la API.
   ========================================================================== */

/* Solo acciones geolocalizadas dentro del polígono generan puntos.
   El tour 360° da progresión (insignias), NO puntos: evita el farmeo remoto. */
var PH_PUNTOS_POR = { avistamiento: 10, denuncia: 15, reconocer: 10, nivel: 15 };

/* Modo de uso: un solo motor, tres configuraciones.
   visitante (cuenta propia) · tutor (perfiles de niños) · escuela (sin cupones) */
function phModo() { return localStorage.getItem('ph_modo') || 'visitante'; }
function phSetModo(m) { localStorage.setItem('ph_modo', m); }
function phCuponesActivos() { return phModo() !== 'escuela'; }

/* Insignias de progresión (tour y otros hitos no canjeables) */
function phInsignias() { return JSON.parse(localStorage.getItem('ph_insignias') || '[]'); }
function phDarInsignia(id) {
  var lista = phInsignias();
  if (lista.indexOf(id) >= 0) return false;
  lista.push(id);
  localStorage.setItem('ph_insignias', JSON.stringify(lista));
  return true;
}

/* Niveles: la confianza que el humedal deposita en el visitante.
   No se compran ni se regalan: solo acciones reales en terreno. */
var PH_NIVELES = [
  { min: 0, nombre: 'Visitante' },
  { min: 30, nombre: 'Vecino del humedal' },
  { min: 80, nombre: 'Guardián de la ribera' },
  { min: 150, nombre: 'Voz del humedal' }
];

function phNivel() {
  var pts = phPuntos(), actual = PH_NIVELES[0], siguiente = null;
  for (var i = 0; i < PH_NIVELES.length; i++) {
    if (pts >= PH_NIVELES[i].min) actual = PH_NIVELES[i];
    else { siguiente = PH_NIVELES[i]; break; }
  }
  return { nombre: actual.nombre, siguiente: siguiente ? siguiente.nombre : null,
           faltan: siguiente ? siguiente.min - pts : 0 };
}

function phPuntos() {
  return parseInt(localStorage.getItem('ph_puntos') || '0', 10);
}

function phSumarPuntos(motivo) {
  var pts = PH_PUNTOS_POR[motivo] || 0;
  if (!pts) return 0;
  localStorage.setItem('ph_puntos', String(phPuntos() + pts));
  var hist = JSON.parse(localStorage.getItem('ph_puntos_hist') || '[]');
  hist.unshift({ motivo: motivo, puntos: pts, fecha: new Date().toISOString() });
  localStorage.setItem('ph_puntos_hist', JSON.stringify(hist.slice(0, 50)));
  return pts;
}

function phGastarPuntos(pts) {
  var saldo = phPuntos();
  if (saldo < pts) return false;
  localStorage.setItem('ph_puntos', String(saldo - pts));
  return true;
}

/* ---- Catálogo de cupones (comercios de ejemplo para la maqueta) ---------- */
var PH_CUPONES = [
  { id: 'cafe-humedal', icono: '☕', comercio: 'Café La Última Frontera', oferta: '2x1 en café de grano', costo: 30 },
  { id: 'kayak-cruces', icono: '🛶', comercio: 'Kayak Río Cruces', oferta: '20% dcto. en salida guiada', costo: 60 },
  { id: 'libreria-austral', icono: '📚', comercio: 'Librería Qué Leo Valdivia', oferta: '15% dcto. en guías de aves', costo: 40 },
  { id: 'jardin-botanico', icono: '🌱', comercio: 'Vivero Nativo', oferta: 'Un árbol nativo para plantar', costo: 80 },
  { id: 'cine-club', icono: '🎬', comercio: 'Cine Club UACh', oferta: 'Entrada al ciclo de cine ambiental', costo: 50 }
];

function phCanjes() {
  return JSON.parse(localStorage.getItem('ph_canjes') || '[]');
}

function phCanjear(cuponId) {
  var c = PH_CUPONES.find(function (x) { return x.id === cuponId; });
  if (!c || !phGastarPuntos(c.costo)) return null;
  var codigo = 'HV-' + cuponId.split('-')[0].toUpperCase() + '-' +
               Math.random().toString(36).slice(2, 7).toUpperCase();
  var canje = { cupon: cuponId, codigo: codigo, fecha: new Date().toISOString() };
  var lista = phCanjes();
  lista.unshift(canje);
  localStorage.setItem('ph_canjes', JSON.stringify(lista));
  return canje;
}

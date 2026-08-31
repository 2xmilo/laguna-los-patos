/* ==========================================================================
   HABITANTES DEL HUMEDAL · El visitante es recibido, no opera una herramienta
   Cuatro especies reales de los humedales de Valdivia, cuatro personalidades
   derivadas de su biología. El usuario elige un compañero que lo acompaña;
   cada estación del tour la narra su propio anfitrión.
   Nunca se le miente al niño: simplemente se le cuenta menos.
   ========================================================================== */

// Perfil etario y compañero elegido. Ambos en localStorage: se eligen UNA sola
// vez y se recuerdan entre sesiones (antes el perfil vivía en sessionStorage y
// se borraba al cerrar, por eso lo re-preguntaba). Se cambian desde el perfil.
var PH_PERFIL = localStorage.getItem('ph_perfil') || null;
var PH_COMPANERO = localStorage.getItem('ph_companero') || null;

function phSetPerfil(p) {
  PH_PERFIL = p;
  localStorage.setItem('ph_perfil', p);
}
function phSetCompanero(a) {
  if (!PH_PERSONAJES[a]) return;
  PH_COMPANERO = a;
  localStorage.setItem('ph_companero', a);
  phCambiarPersonaje(a);
}
function phCompanero() { return PH_COMPANERO || 'ranita'; }  // default honesto: especie real y presente, no el Cisne (ausente)

/* -------- Los cuatro habitantes (SVG inline animable por CSS) -------------- */
var PH_PERSONAJES = {
  cisne: {
    slug: 'cisne-cuello-negro',
    nombre: 'Cisne de Cuello Negro',
    especie: 'Cygnus melancoryphus',
    lema: 'La memoria del humedal. Lleva a sus crías en la espalda.',
    svg:
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="32" cy="54" rx="24" ry="5" fill="#1E5D6E" opacity=".55"/>' +
      '<g class="av-cuerpo">' +
      '<path d="M12 46 Q10 34 22 31 Q36 28 46 34 Q54 38 50 46 Q46 52 30 52 Q16 52 12 46Z" fill="#F5F2EA"/>' +
      '<path d="M46 34 Q56 30 58 24 Q54 33 49 37Z" fill="#F5F2EA"/>' +
      '<path class="av-cuello" d="M40 36 Q50 32 48 22 Q46 14 42 12" fill="none" stroke="#20262B" stroke-width="6" stroke-linecap="round"/>' +
      '<g class="av-cabeza">' +
      '<circle cx="41.5" cy="11.5" r="5.5" fill="#20262B"/>' +
      '<path class="av-pico-sup" d="M36.8 10.5 L30.5 12.2 L36.6 13.4Z" fill="#B9C3CC"/>' +
      '<path class="av-pico-inf" d="M36.8 13 L31.5 13.6 L36.6 14.6Z" fill="#94A0AA"/>' +
      '<circle cx="38.2" cy="11.8" r="1.6" fill="#C0392B"/>' +
      '<g class="av-ojo"><circle cx="42.5" cy="10" r="1.5" fill="#fff"/><circle cx="42.7" cy="10.2" r=".8" fill="#111"/></g>' +
      '</g></g></svg>'
  },
  monito: {
    slug: 'monito-del-monte',
    nombre: 'Monito del Monte',
    especie: 'Dromiciops gliroides',
    lema: 'El sabio antiguo. Fósil viviente que siembra el bosque de noche.',
    svg:
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g class="av-cuerpo">' +
      '<ellipse cx="32" cy="46" rx="15" ry="11" fill="#8A6B4F"/>' +
      '<path class="av-cola" d="M45 48 Q56 46 55 36" fill="none" stroke="#7A5C42" stroke-width="4" stroke-linecap="round"/>' +
      '<g class="av-cabeza">' +
      '<circle class="av-oreja" cx="21" cy="17" r="6.5" fill="#7A5C42"/>' +
      '<circle class="av-oreja av-oreja2" cx="43" cy="17" r="6.5" fill="#7A5C42"/>' +
      '<circle cx="21" cy="17" r="3.4" fill="#D9A98C"/>' +
      '<circle cx="43" cy="17" r="3.4" fill="#D9A98C"/>' +
      '<circle cx="32" cy="26" r="13" fill="#9C7B5B"/>' +
      '<ellipse cx="32" cy="31" rx="7.5" ry="6" fill="#C9AB8C"/>' +
      '<g class="av-ojo"><circle cx="26.5" cy="23.5" r="3.6" fill="#241A12"/><circle cx="27.6" cy="22.4" r="1.1" fill="#fff"/></g>' +
      '<g class="av-ojo"><circle cx="37.5" cy="23.5" r="3.6" fill="#241A12"/><circle cx="38.6" cy="22.4" r="1.1" fill="#fff"/></g>' +
      '<ellipse cx="32" cy="29.5" rx="1.9" ry="1.4" fill="#3E2A1C"/>' +
      '<path class="av-boca" d="M29.5 33 Q32 35 34.5 33" fill="none" stroke="#3E2A1C" stroke-width="1.3" stroke-linecap="round"/>' +
      '</g></g></svg>'
  },
  ranita: {
    slug: 'ranita-darwin',
    nombre: 'Ranita de Darwin',
    especie: 'Rhinoderma darwinii',
    lema: 'La observadora paciente. Se camufla como hoja y mira lo pequeño.',
    svg:
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="32" cy="55" rx="20" ry="4" fill="#2C5530" opacity=".35"/>' +
      '<g class="av-cuerpo">' +
      '<path d="M14 50 Q10 38 22 33 Q30 29 42 33 Q54 38 50 48 Q46 54 32 54 Q18 54 14 50Z" fill="#7A9B4E"/>' +
      '<path d="M22 36 L30 46 M38 36 L32 46" stroke="#5C7A3A" stroke-width="1.3" fill="none" opacity=".7"/>' +
      '<g class="av-cabeza">' +
      '<path d="M20 34 Q19 22 31 20 Q41 19 48 27 Q44 38 32 39 Q23 39 20 34Z" fill="#8FAE5D"/>' +
      '<g class="av-ojo"><circle cx="27" cy="24" r="3.2" fill="#2E2A20"/><circle cx="28" cy="23.2" r="1" fill="#fff"/></g>' +
      '<g class="av-ojo"><circle cx="37" cy="24.5" r="3" fill="#2E2A20"/><circle cx="37.8" cy="23.8" r=".9" fill="#fff"/></g>' +
      '<circle class="av-saco" cx="33" cy="34" r="4" fill="#C9D8A0" opacity=".9"/>' +
      '<path class="av-boca" d="M26 32.5 Q34 35.5 44 28.5" fill="none" stroke="#4C5B33" stroke-width="1.4" stroke-linecap="round"/>' +
      '</g></g></svg>'
  },
  garza: {
    slug: 'garza-grande',
    nombre: 'Garza Grande',
    especie: 'Ardea alba',
    lema: 'La cazadora quieta. Enseña a esperar sin apurar la mirada.',
    svg:
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="30" cy="56" rx="20" ry="3.5" fill="#1E5D6E" opacity=".45"/>' +
      '<g class="av-cuerpo">' +
      '<path d="M22 54 L24 42 M30 54 L28.5 42" stroke="#4A4E52" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M14 38 Q15 28 29 29 Q42 31 40 40 Q37 46 25 45 Q16 43 14 38Z" fill="#F7F5EF"/>' +
      '<path d="M14 38 Q8 40 6 44 Q12 44 16 41Z" fill="#F7F5EF"/>' +
      '<path class="av-cuello" d="M33 31 Q42 28 40 20 Q38 13 42 10" fill="none" stroke="#F7F5EF" stroke-width="5" stroke-linecap="round"/>' +
      '<g class="av-cabeza">' +
      '<circle cx="43" cy="9.5" r="4.5" fill="#F7F5EF"/>' +
      '<path class="av-pico-sup" d="M47 8.5 L57 10.2 L47 11.2Z" fill="#E0A93E"/>' +
      '<path class="av-pico-inf" d="M47 11.4 L54.5 12.2 L47 12.8Z" fill="#C88F2B"/>' +
      '<g class="av-ojo"><circle cx="44.6" cy="8.6" r="1.3" fill="#111"/></g>' +
      '</g></g></svg>'
  }
};

/* -------- Historias ---------------------------------------------------------
   bienvenida: el compañero elegido recibe al visitante (por perfil)
   estaciones: cada estación la narra su anfitrión (por perfil)
   avistamiento / reporte: reacción del compañero
   --------------------------------------------------------------------------- */
var PH_HISTORIAS = {
  bienvenida: {
    cisne: {
      guardian: '¡Hola! Soy el Cisne. Este humedal es mi casa y te la voy a mostrar. Vamos con cuidado, ¿sí?',
      explorador: 'Bienvenido. Soy el Cisne de Cuello Negro, el guía de este humedal. Sígueme, hay cosas que solo se ven mirando con calma.',
      guardabosques: 'Bienvenido al humedal. Soy Cygnus melancoryphus, el ave emblema de Valdivia. Cargo la memoria de este lugar: te acompaño en el recorrido.'
    },
    monito: {
      guardian: '¡Hola! Soy el Monito del Monte. Soy pequeñito pero muy, muy viejito. Ven, te muestro mi casa… despacito, que de día tengo sueño.',
      explorador: 'Soy el Monito del Monte, el mamífero más antiguo de Sudamérica. Este humedal guarda historias de antes de los Andes. Vení, te las cuento.',
      guardabosques: 'Dromiciops gliroides te da la bienvenida. Mi linaje sobrevivió a la separación de Gondwana: este humedal es el capítulo más reciente de una historia larguísima. Recorrámoslo.'
    },
    ranita: {
      guardian: '¡Hola! Soy la Ranita de Darwin. Casi nadie me ve porque parezco una hojita. Si caminas despacito, te muestro los secretos chiquititos del humedal.',
      explorador: 'Soy la Ranita de Darwin. Mi especialidad es pasar desapercibida y ver lo que nadie mira. Vení: el humedal se entiende mejor en pequeño.',
      guardabosques: 'Rhinoderma darwinii, endémica del bosque valdiviano y En Peligro. Te acompaño a mirar el humedal a mi escala: lo diminuto sostiene todo el ecosistema.'
    },
    garza: {
      guardian: 'Hola, soy la Garza. Yo me quedo muy muy quieta para verlo todo. Ven conmigo: juguemos a mirar sin apurarnos.',
      explorador: 'Soy la Garza Grande. Mi técnica es simple: quietud y paciencia. Lo que vale la pena ver aparece cuando dejás de apurarte. Te acompaño.',
      guardabosques: 'Ardea alba te recibe. Cazo por espera: la observación inmóvil es mi método, y también sirve para conocer un humedal. Vamos.'
    }
  },
  avistamiento: {
    cisne: 'Buen avistamiento. Quedó registrado y georreferenciado: el dato ya es parte de la memoria del humedal.',
    monito: 'Buen hallazgo. Cada registro es una historia nueva en un lugar muy antiguo. Quedó guardado.',
    ranita: '¡Qué buen ojo! Viste lo que casi nadie ve. Quedó registrado en el álbum del humedal.',
    garza: 'La paciencia dio fruto: buen avistamiento. Quedó validado y registrado para la ciencia ciudadana.'
  },
  reporte: {
    cisne: 'Denuncia enviada de forma anónima al panel municipal. Defender este lugar es cuidar la casa de todos. Gracias por ser sus ojos.',
    monito: 'Reporte recibido. Este bosque tardó milenios en formarse; gracias por defenderlo hoy.',
    ranita: 'Gracias por avisar. Los daños chicos también cuentan, y nadie los ve mejor que quienes miran de cerca.',
    garza: 'Reporte enviado al panel municipal. Observaste bien y a tiempo: así se cuida la orilla.'
  },
  reporte_guardian: 'Gracias por avisarle a tu adulto. Cuidar el humedal es cuidar nuestra casa.'
};

/* ============================================================================
   REGLA DE VOZ (escalable a toda la red)
   Cada humedal declara sus `especies` reales (en data/humedales.json). El avatar
   elegido habla en 1a persona SOLO si su especie esta presente en ese humedal; si
   no, narra como GUIA. Los guiones de lugar (PH_LUGARES) solo nombran especies
   reales del sitio. Sumar un humedal nuevo = cargar sus `especies`, sin reescribir
   avatares.
   ============================================================================ */

// Capa de personalidad reutilizable: intro corta del avatar, segun este presente
// o no. Cisne y Monito no estan en estos humedales -> solo voz de guia.
var PH_INTRO = {
  cisne:  { guia: 'Te acompaño como guía por este humedal.' },
  monito: { guia: 'Soy el Monito del Monte. Yo habito los bosques pantanosos —los hualves—, no este humedal, pero te lo muestro con gusto.' },
  ranita: { presente: 'Soy la Ranita de Darwin. Mi rincón es el totoral, pero desde acá se ve todo.',
            guia: 'Soy la Ranita de Darwin, y te acompaño a mirar de cerca.' },
  garza:  { presente: 'Soy la Garza, de las que cazan quietas en estos bordes.',
            guia: 'Soy la Garza, y te acompaño a observar con paciencia.' }
};

// Contenido del LUGAR (hechos + especies reales del sitio), por perfil etario.
// El avatar lo entrega con su intro (PH_INTRO). Neutro de anfitrión: no dice
// "Soy la Garza…" ni nombra especies ausentes. Las estaciones de reportar hablan
// del daño en CONDICIONAL (no afirman que haya basura).
var PH_LUGARES = {
  'espejo-de-agua': {
    guardian: 'Esta es el agua abierta de la laguna. Ahí flotan las flores de loto, y nadan los patos y las taguas, unos pajaritos negros de pico blanco. ¿Cuántos podés contar?',
    explorador: 'El espejo de agua abierta de la laguna, con flores de loto flotando en la superficie. Acá mandan los patos —que llegaron con la gente y ya no se fueron— y las taguas, que se disputan cada rincón a los gritos.',
    guardabosques: 'Espejo de agua: la lámina abierta de la laguna, cubierta de flor de loto que flota sobre la superficie. La fauna visible aquí son patos introducidos y taguas. Es el corazón de la laguna, y la observación ciudadana es hoy su principal vigilancia.'
  },
  'ribera': {
    guardian: 'Esta es la orilla, donde el agua toca la tierra: la parte más delicada del humedal. Si ves algo raro que lo pueda dañar, avisale a tu adulto.',
    explorador: 'La ribera es la frontera entre el agua y la tierra, y la zona más expuesta a la ciudad. Si ves algo que dañe el humedal —basura, un relleno, un borde alterado—, acá tu reporte es el que más pesa.',
    guardabosques: 'Ribera: interfaz acuático-terrestre y zona de mayor presión urbana. Es donde primero aparecen los signos de deterioro; por eso los reportes georreferenciados desde aquí son los más valiosos para el panel municipal.'
  },
  'si-mirador': {
    guardian: 'Desde aquí arriba se ve todo el humedal, con la ciudad alrededor. ¿Ves cuántas casas lo rodean? También es un vecino del barrio.',
    explorador: 'Desde el mirador, Santa Inés aparece rodeado de calles, casas y un colegio. Desde la altura se entiende algo clave: no es un sitio eriazo, es un vecino vivo del barrio.',
    guardabosques: 'Santa Inés desde la altura: un humedal urbano inserto en plena matriz de la ciudad. La urbanización fragmenta el hábitat, pero también acerca observadores: cada vecino que mira es vigilancia potencial.'
  },
  'si-totoral': {
    guardian: 'Este mar de juncos dorados parece dormido en invierno… ¡pero está lleno de vida escondida! Mirá despacito y la vas a descubrir.',
    explorador: 'El corazón del totoral. En invierno se ve dorado y quieto, pero entre los junquillos esperan nidos, anfibios e insectos a que llegue la primavera. Acá lo pequeño manda.',
    guardabosques: 'Junquillal denso: refugio y sitio de nidificación. La senescencia invernal es parte del ciclo — la biomasa seca protege el rebrote y a la fauna. Donde el ojo ve «campo seco», el humedal sigue trabajando.'
  },
  'si-borde': {
    guardian: 'Aquí el humedal toca la calle, y ese canalito se lleva su agua: es la parte más frágil. Si ves algo que lo dañe, avisale a tu adulto.',
    explorador: 'El borde: la calle, los autos y el canal de drenaje que aprietan al humedal. Antes era más ancho. Es la primera línea de pérdida — si ves algo que lo dañe, acá tu reporte importa más que en ningún lado.',
    guardabosques: 'Interfaz humedal-ciudad: drenaje, relleno histórico y presión inmobiliaria. Los bordes son la primera línea de pérdida de superficie; reportar aquí tiene el máximo valor.'
  }
};

// ¿El avatar elegido esta presente en este humedal? (lista `especies` del JSON)
function phAvatarPresente(especies) {
  var s = (PH_PERSONAJES[phCompanero()] || {}).slug;
  return !!s && (especies || []).indexOf(s) >= 0;
}

// Narracion de una estacion: el avatar ELEGIDO narra el contenido de lugar
// (PH_LUGARES), en 1a persona si su especie esta presente, o como guia si no.
// Devuelve { texto, quien }.
function phNarrarEstacion(slug, especies) {
  var perfil = PH_PERFIL || 'guardabosques';
  var comp = phCompanero();
  var voz = PH_INTRO[comp] || {};
  var intro = phAvatarPresente(especies) ? (voz.presente || voz.guia) : voz.guia;
  var lugar = (PH_LUGARES[slug] || {})[perfil] || '';
  return { texto: (intro || '') + (intro && lugar ? ' ' : '') + lugar, quien: comp };
}

function phHistoria(grupo, clave) {
  var perfil = PH_PERFIL || 'guardabosques';
  if (grupo === 'bienvenida') return PH_HISTORIAS.bienvenida[phCompanero()][perfil];
  if (grupo === 'avistamiento') return PH_HISTORIAS.avistamiento[phCompanero()];
  if (grupo === 'reporte') {
    return perfil === 'guardian' ? PH_HISTORIAS.reporte_guardian : PH_HISTORIAS.reporte[phCompanero()];
  }
  return '';
}

/* -------- Widget flotante -------------------------------------------------- */
var phQuienActual = null;
var phTypeTimer = null;

function phMontarAvatar() {
  if (document.getElementById('ph-avatar')) return;
  phQuienActual = phCompanero();
  var box = document.createElement('div');
  box.id = 'ph-avatar';
  box.className = 'ph-avatar';
  box.innerHTML =
    '<button class="ph-avatar__cara" id="ph-avatar-cara" aria-label="Hablar con tu compañero">' +
    PH_PERSONAJES[phQuienActual].svg +
    '</button>' +
    '<div class="ph-avatar__globo" id="ph-avatar-globo" hidden>' +
    '<strong id="ph-avatar-nombre"></strong>' +
    '<span id="ph-avatar-texto"></span>' +
    '</div>';
  document.body.appendChild(box);
  document.getElementById('ph-avatar-cara').addEventListener('click', function () {
    var globo = document.getElementById('ph-avatar-globo');
    globo.hidden = !globo.hidden;
  });
}

function phCambiarPersonaje(quien) {
  if (!PH_PERSONAJES[quien]) return;
  phQuienActual = quien;
  var cara = document.getElementById('ph-avatar-cara');
  if (cara) cara.innerHTML = PH_PERSONAJES[quien].svg;
}

/* Texto con máquina de escribir; el personaje "habla" mientras escribe.
   Si no se indica quién habla, habla el compañero elegido. */
function phDecir(texto, opts) {
  opts = opts || {};
  phMontarAvatar();
  if (!texto) return;
  phCambiarPersonaje(opts.quien || phCompanero());
  var p = PH_PERSONAJES[phQuienActual];
  var globo = document.getElementById('ph-avatar-globo');
  var nombre = document.getElementById('ph-avatar-nombre');
  var cuerpo = document.getElementById('ph-avatar-texto');
  var cara = document.getElementById('ph-avatar-cara');
  nombre.textContent = p.nombre;
  globo.hidden = false;

  clearInterval(phTypeTimer);
  cuerpo.textContent = '';
  cara.classList.add('hablando');
  var i = 0;
  phTypeTimer = setInterval(function () {
    cuerpo.textContent = texto.slice(0, ++i);
    if (i >= texto.length) { clearInterval(phTypeTimer); cara.classList.remove('hablando'); }
  }, 22);
}

/* Nota: la voz por speechSynthesis se quitó (calidad insuficiente).
   Cuando existan relatos grabados, agregar aquí un reproductor de audio
   que active la clase .hablando mientras suena. */

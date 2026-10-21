/* ==========================================================================
   HABITANTES DEL HUMEDAL · El visitante es recibido, no opera una herramienta
   Cuatro especies reales de los humedales de Valdivia, cuatro personalidades
   derivadas de su biología. No se le pregunta nada al visitante para entrar:
   cada humedal lo recibe un habitante que de verdad vive ahí (phFijarAnfitrion).
   Si el visitante fija un compañero en Perfil, ese manda en todos lados.
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

function phLimpiarCompanero() {   // volver a "que me reciba quien vive acá"
  PH_COMPANERO = null;
  localStorage.removeItem('ph_companero');
  phCambiarPersonaje(phCompanero());
}

/* -------- El humedal elige a su anfitrión ---------------------------------
   Ya no se le pregunta nada al visitante para entrar: cada humedal es recibido
   por un habitante que **de verdad vive ahí** (sale de su lista `especies`, la
   misma regla de biología honesta). El anfitrión NO se guarda: es del lugar,
   no del usuario. Si el visitante elige compañero en Perfil, ese manda siempre.
   La elección es estable por humedal (se deriva del id, no al azar). */
var PH_ANFITRION = null;

function phAnfitrionDe(humedal) {
  if (!humedal) return null;
  var presentes = Object.keys(PH_PERSONAJES).filter(function (k) {
    return (humedal.especies || []).indexOf(PH_PERSONAJES[k].slug) >= 0;
  });
  if (!presentes.length) return null;          // nadie de los cuatro vive acá
  var semilla = 0, sid = humedal.id || '';
  for (var i = 0; i < sid.length; i++) semilla += sid.charCodeAt(i);
  return presentes[semilla % presentes.length];
}
function phFijarAnfitrion(humedal) {
  PH_ANFITRION = phAnfitrionDe(humedal);
  if (!PH_COMPANERO && PH_ANFITRION) phCambiarPersonaje(PH_ANFITRION);
}

// Compañero elegido > anfitrión del humedal > ranita (especie real y presente
// en los humedales con tour; nunca el Cisne, que hoy no está en ninguna lista).
function phCompanero() { return PH_COMPANERO || PH_ANFITRION || 'ranita'; }

/* -------- Los cuatro habitantes (SVG inline animable por CSS) --------------
   Cada uno es un medallón: el animal en su ambiente (agua, rama, hojarasca,
   juncos), recortado en círculo. Cada especie lleva su rasgo reconocible:
   carúncula roja del cisne, antifaz del monito, nariz puntiaguda de la ranita,
   pico-daga amarillo de la garza. Las clases av-* son las que anima style.css. */

// El recorte circular usa un clipPath con id, y el mismo personaje se pinta
// varias veces en una página (widget, perfil, selector): cada lectura de `.svg`
// arma el SVG con un id nuevo para que no choquen.
var phSvgN = 0;
function phMedallon(dibujo) {
  var id = 'ph-av-clip-' + (++phSvgN);
  return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><clipPath id="' + id + '"><circle cx="60" cy="60" r="60"/></clipPath></defs>' +
    '<g clip-path="url(#' + id + ')">' + dibujo + '</g></svg>';
}

var PH_PERSONAJES = {
  cisne: {
    slug: 'cisne-cuello-negro',
    nombre: 'Cisne de Cuello Negro',
    especie: 'Cygnus melancoryphus',
    lema: 'La memoria del humedal. Lleva a sus crías en la espalda.',
    get svg() { return phMedallon(this.dibujo); },
    dibujo:
      '<rect width="120" height="120" fill="#CFE2E4"/>' +
      '<path d="M0 34 C30 30 60 36 120 30 L120 44 C80 48 40 42 0 46Z" fill="#B7D2D3"/>' +
      '<rect y="80" width="120" height="40" fill="#5F94A3"/>' +
      '<path d="M8 92 H40 M70 98 H110 M20 106 H60 M84 88 H112" stroke="#8DB8C3" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M34 86 C50 100 86 100 98 86Z" fill="#3F6F7C" opacity=".55"/>' +
      '<g class="av-cuerpo">' +
      '<path d="M28 82 C26 70 38 63 56 63 C72 63 86 64 99 54 C102 66 97 77 87 82 C74 90 42 91 28 82Z" fill="#FBFAF6"/>' +
      '<path d="M50 72 C62 65 80 65 97 57 C94 70 82 79 63 81 C56 81 50 77 50 72Z" fill="#E7E5DD"/>' +
      '<path d="M60 74 C70 71 80 69 90 64 M64 78 C74 76 82 73 90 69" stroke="#D3D0C6" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M28 82 C40 86 70 88 87 82 C74 90 42 91 28 82Z" fill="#DCD9CF"/>' +
      '<path class="av-cuello" d="M45 75 C34 67 31 56 37 46 C43 36 44 30 38 26" fill="none" stroke="#1B1E21" stroke-width="9" stroke-linecap="round"/>' +
      '<g class="av-cabeza">' +
      '<ellipse cx="34" cy="25" rx="8.5" ry="6.6" fill="#1B1E21"/>' +
      '<path d="M33 22.3 C37 20.4 41.5 21 44 24.5 C40.5 23.4 36.5 23.4 33 24.2Z" fill="#F4F2EC"/>' +
      '<path class="av-pico-sup" d="M27.5 22.3 C22 22.4 16.5 25 12.5 28.4 C17 29.6 23 29.6 27.8 28.2Z" fill="#9AACB7"/>' +
      '<path class="av-pico-inf" d="M12.5 28.4 C17 29.6 23 29.6 27.8 28.2 L27.8 27 C23 27.6 17.5 28 12.5 28.4Z" fill="#76899A"/>' +
      '<path d="M28.6 22 C27 17 21.5 17.4 21 21.6 C22.6 23 26 23.2 28.6 22Z" fill="#D2382C"/>' +
      '<path d="M24 19.2 C25.4 18.6 26.8 19.2 27.3 20.2" stroke="#EF6A5E" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
      '<g class="av-ojo"><circle cx="31.2" cy="23.6" r="1.5" fill="#050505"/><circle cx="30.8" cy="23.1" r=".45" fill="#fff"/></g>' +
      '</g></g>'
  },
  monito: {
    slug: 'monito-del-monte',
    nombre: 'Monito del Monte',
    especie: 'Dromiciops gliroides',
    lema: 'El sabio antiguo. Fósil viviente que siembra el bosque de noche.',
    get svg() { return phMedallon(this.dibujo); },
    dibujo:
      '<rect width="120" height="120" fill="#24382D"/>' +
      '<path d="M0 0 H120 V40 C90 30 50 44 0 34Z" fill="#2E4637"/>' +
      '<path d="M8 24 C16 14 28 16 30 26 C22 30 12 30 8 24Z M94 12 C104 6 116 12 114 22 C106 24 98 20 94 12Z M100 46 C108 40 118 44 118 52 C110 56 104 54 100 46Z" fill="#3C5E45"/>' +
      '<path d="M8 24 L30 26 M94 12 L114 22 M100 46 L118 52" stroke="#2A4232" stroke-width=".8"/>' +
      '<path d="M-4 100 C30 90 70 92 124 80 L124 90 C70 102 30 100 -4 110Z" fill="#6B4A32"/>' +
      '<path d="M10 100 C40 94 70 94 110 85" stroke="#8A6545" stroke-width="1.2" fill="none"/>' +
      '<g class="av-cuerpo">' +
      '<g class="av-cola">' +
      '<path d="M76 84 C92 86 98 94 92 102 C88 107 80 104 82 98" fill="none" stroke="#6F5E50" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M82 98 C84 94 88 95 88 98" fill="none" stroke="#5E4F43" stroke-width="3.5" stroke-linecap="round"/>' +
      '</g>' +
      '<ellipse cx="60" cy="74" rx="20" ry="19" fill="#857262"/>' +
      '<ellipse cx="60" cy="80" rx="12" ry="12.5" fill="#E9DFCD"/>' +
      '<path d="M44 66 l-3 2 M46 74 l-3 1.5 M75 66 l3 2 M74 74 l3 1.5" stroke="#6E5D4F" stroke-width="1.1" stroke-linecap="round"/>' +
      '<ellipse cx="49" cy="91" rx="5" ry="3.2" fill="#D4A194"/>' +
      '<ellipse cx="71" cy="90" rx="5" ry="3.2" fill="#D4A194"/>' +
      '<path d="M45.5 91 v2 M48.5 91.8 v2 M51.5 91.5 v2 M67.5 90.5 v2 M70.5 91.2 v2 M73.5 91 v2" stroke="#B9857A" stroke-width=".9" stroke-linecap="round"/>' +
      '<g class="av-cabeza">' +
      '<circle class="av-oreja" cx="45" cy="32" r="7" fill="#7A6858"/>' +
      '<circle class="av-oreja av-oreja2" cx="75" cy="32" r="7" fill="#7A6858"/>' +
      '<circle cx="45.5" cy="32.5" r="4" fill="#E2B6A6"/>' +
      '<circle cx="74.5" cy="32.5" r="4" fill="#E2B6A6"/>' +
      '<circle cx="60" cy="47" r="18.5" fill="#968371"/>' +
      '<path d="M60 29 C57 34 57 40 60 44 C63 40 63 34 60 29Z" fill="#A99785"/>' +
      '<ellipse cx="60" cy="55" rx="9" ry="6.8" fill="#DDD0BD"/>' +
      '<ellipse cx="50.5" cy="45" rx="7.4" ry="6.6" fill="#2A1F17"/>' +
      '<ellipse cx="69.5" cy="45" rx="7.4" ry="6.6" fill="#2A1F17"/>' +
      '<g class="av-ojo"><circle cx="51" cy="45.2" r="4.8" fill="#0B0806"/><circle cx="52.6" cy="43.4" r="1.7" fill="#fff"/><circle cx="49.6" cy="47" r=".7" fill="#fff" opacity=".6"/></g>' +
      '<g class="av-ojo"><circle cx="69" cy="45.2" r="4.8" fill="#0B0806"/><circle cx="70.6" cy="43.4" r="1.7" fill="#fff"/><circle cx="67.6" cy="47" r=".7" fill="#fff" opacity=".6"/></g>' +
      '<ellipse cx="60" cy="52.4" rx="2.6" ry="1.9" fill="#C4857F"/>' +
      '<path d="M60 54.3 V56.4" stroke="#6B4E44" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
      '<path class="av-boca" d="M57.4 57.6 C58.6 58.6 61.4 58.6 62.6 57.6" stroke="#6B4E44" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
      '<path d="M53 55 L41 53 M53 56.5 L42 58 M67 55 L79 53 M67 56.5 L78 58" stroke="#EDE4D6" stroke-width=".5" opacity=".8"/>' +
      '</g></g>'
  },
  ranita: {
    slug: 'ranita-darwin',
    nombre: 'Ranita de Darwin',
    especie: 'Rhinoderma darwinii',
    lema: 'La observadora paciente. Se camufla como hoja y mira lo pequeño.',
    get svg() { return phMedallon(this.dibujo); },
    dibujo:
      '<rect width="120" height="120" fill="#35502E"/>' +
      '<path d="M0 20 C20 10 40 18 60 8 C80 0 100 10 120 4 V0 H0Z" fill="#40603A"/>' +
      '<path d="M90 30 C100 22 114 26 118 36 C108 42 96 40 90 30Z M4 48 C10 38 24 38 28 46 C20 52 10 54 4 48Z" fill="#4C7342"/>' +
      '<path d="M90 30 L118 36 M4 48 L28 46" stroke="#3A5A33" stroke-width=".8"/>' +
      '<path d="M-2 100 C20 86 70 84 122 92 L122 120 H-2Z" fill="#7A5F33"/>' +
      '<path d="M6 98 C36 90 74 89 116 95" stroke="#957646" stroke-width="1.4" fill="none"/>' +
      '<path d="M30 104 C50 98 80 98 104 102" stroke="#69512B" stroke-width="1" fill="none"/>' +
      '<g class="av-cuerpo">' +
      '<path d="M88 74 C100 72 106 82 98 88 C92 92 80 92 72 90Z" fill="#6A7C30"/>' +
      '<path d="M76 90 C68 94 58 95 50 94 C54 91 64 90 72 89Z" fill="#5E6E2A"/>' +
      '<path d="M50 94 l-5 1 M50 94 l-4 -1.6 M50 94 l-4.5 2.8" stroke="#5E6E2A" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M30 71 C32 61 42 55 56 55 C72 55 86 61 90 73 C92 81 86 87 74 87 L44 87 C36 87 30 81 30 71Z" fill="#7F933F"/>' +
      '<g class="av-cabeza">' +
      '<path d="M46 56 C37 54 25 57 17.5 62 C15 63.8 15.2 66.4 18 68.2 C24 73.5 33 79 46 80Z" fill="#879C44"/>' +
      '<path class="av-saco" d="M19.5 68.6 C26 74.6 35 78.6 46 79.4 L46 75.6 C37 75.4 27.5 72.6 19.5 68.6Z" fill="#9AAF55"/>' +
      '<path d="M17.6 61.8 L12.4 63.4 L16.6 65.2Z" fill="#6F8436"/>' +
      '</g>' +
      '<path d="M50 58 L58 68 L66 58 M64 62 L72 72 L80 62" stroke="#5E5B27" stroke-width="2.4" fill="none" stroke-linejoin="round" opacity=".75"/>' +
      '<path d="M38 64 C52 70 72 70 88 70" stroke="#B5C46A" stroke-width="1.4" fill="none" opacity=".85"/>' +
      '<path d="M34 82 C44 88 70 88 84 83 L84 87 L36 87Z" fill="#171512"/>' +
      '<circle cx="46" cy="85" r="1.1" fill="#F2EFE6"/><circle cx="55" cy="86" r=".9" fill="#F2EFE6"/>' +
      '<circle cx="64" cy="85.4" r="1.2" fill="#F2EFE6"/><circle cx="74" cy="85" r=".9" fill="#F2EFE6"/>' +
      '<path class="av-boca" d="M16.8 65.4 C23 68.6 31 70.6 41 70.6" stroke="#4E5C24" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M22 72.6 C28 75.4 34 76.6 40 77" stroke="#C3D08A" stroke-width=".8" fill="none" opacity=".7"/>' +
      '<path d="M42 77 C40 83 38 87 36 92" stroke="#76893A" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M36 92 l-4 1 M36 92 l-1.5 2.8 M36 92 l2 2.4" stroke="#76893A" stroke-width="1.3" stroke-linecap="round"/>' +
      '<circle cx="33" cy="58" r="5.6" fill="#7F933F"/>' +
      '<g class="av-ojo"><circle cx="33" cy="57.6" r="4" fill="#C6A03C"/><ellipse cx="33" cy="57.6" rx="2.8" ry="1.55" fill="#100D08"/><circle cx="31.8" cy="56.5" r=".85" fill="#fff"/></g>' +
      '</g>'
  },
  garza: {
    slug: 'garza-grande',
    nombre: 'Garza Grande',
    especie: 'Ardea alba',
    lema: 'La cazadora quieta. Enseña a esperar sin apurar la mirada.',
    get svg() { return phMedallon(this.dibujo); },
    dibujo:
      '<rect width="120" height="120" fill="#BCD3CF"/>' +
      '<path d="M0 70 C30 64 70 70 120 62 V92 H0Z" fill="#A9C1B4"/>' +
      '<path d="M8 92 C9 74 12 62 10 48 M14 92 C16 76 18 66 22 54 M20 92 C20 80 24 72 26 64 M104 92 C104 76 108 66 106 54 M110 92 C112 78 114 70 118 62" stroke="#8A9A5A" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '<path d="M11 92 C13 70 16 60 15 46 M107 92 C108 74 110 64 112 52" stroke="#B49B5A" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      '<rect y="92" width="120" height="28" fill="#7FA6AC"/>' +
      '<path d="M10 100 H34 M76 104 H108 M30 112 H70" stroke="#A3C3C6" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M52 94 C50 104 56 112 60 116 C64 110 66 102 64 94Z" fill="#E8EFEE" opacity=".35"/>' +
      '<g class="av-cuerpo">' +
      '<path d="M53 74 L51 95 M61 74 L62 95" stroke="#202224" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M51 92 L51 95 M62 92 L62 95" stroke="#202224" stroke-width="2.6"/>' +
      '<path d="M48 95 H66" stroke="#A3C3C6" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M71 56 C67 50 55 50 47 56 C39 62 34 72 37 82 C44 79 58 75 66 68 C70 64 73 60 71 56Z" fill="#FBFBF8"/>' +
      '<path d="M58 58 C50 62 44 70 41 79 C50 76 60 71 66 66 C68 62 64 58 58 58Z" fill="#E9EDEA"/>' +
      '<path d="M50 64 C44 72 40 82 36 90 M54 64 C48 74 44 84 41 92 M58 64 C54 74 50 84 47 92" stroke="#F4F6F3" stroke-width=".8" fill="none" opacity=".95"/>' +
      '<path class="av-cuello" d="M69 58 C77 52 77 44 71 38 C65 32 67 24 75 20" fill="none" stroke="#FBFBF8" stroke-width="6.2" stroke-linecap="round"/>' +
      '<path d="M72 41 C75 46 74 51 70 55" stroke="#DDE3E0" stroke-width="1.2" fill="none"/>' +
      '<g class="av-cabeza">' +
      '<ellipse cx="78" cy="19" rx="5.8" ry="4.6" fill="#FBFBF8"/>' +
      '<path class="av-pico-sup" d="M82 16.6 L102 20 L82 22.2Z" fill="#E7B62A"/>' +
      '<path class="av-pico-inf" d="M82 20.4 L102 20 L82 22.2Z" fill="#C7951C"/>' +
      '<path d="M80 17 C82 16.8 84 17.4 84.6 18.4 L81 19.4Z" fill="#B6C76A"/>' +
      '<g class="av-ojo"><circle cx="79.4" cy="18.2" r="1.35" fill="#E1B12A"/><circle cx="79.6" cy="18.2" r=".65" fill="#0A0A0A"/></g>' +
      '</g></g>'
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
      explorador: 'Soy el Monito del Monte, el mamífero más antiguo de Sudamérica. Este humedal guarda historias de antes de los Andes. Ven, te las cuento.',
      guardabosques: 'Dromiciops gliroides te da la bienvenida. Mi linaje sobrevivió a la separación de Gondwana: este humedal es el capítulo más reciente de una historia larguísima. Recorrámoslo.'
    },
    ranita: {
      guardian: '¡Hola! Soy la Ranita de Darwin. Casi nadie me ve porque parezco una hojita. Si caminas despacito, te muestro los secretos chiquititos del humedal.',
      explorador: 'Soy la Ranita de Darwin. Mi especialidad es pasar desapercibida y ver lo que nadie mira. Ven: el humedal se entiende mejor en pequeño.',
      guardabosques: 'Rhinoderma darwinii, endémica del bosque valdiviano y En Peligro. Te acompaño a mirar el humedal a mi escala: lo diminuto sostiene todo el ecosistema.'
    },
    garza: {
      guardian: 'Hola, soy la Garza. Yo me quedo muy muy quieta para verlo todo. Ven conmigo: juguemos a mirar sin apurarnos.',
      explorador: 'Soy la Garza Grande. Mi técnica es simple: quietud y paciencia. Lo que vale la pena ver aparece cuando dejas de apurarte. Te acompaño.',
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

// Contenido del LUGAR (hechos + especies reales del sitio), por perfil etario.
// El avatar lo entrega tal cual, sin presentarse: la presentación se hace una
// sola vez, al entrar al humedal (bienvenida en humedal.html). Neutro de
// anfitrión: no dice "Soy la Garza…" ni nombra especies ausentes. Las
// estaciones de reportar hablan del daño en CONDICIONAL (no afirman que haya basura).
var PH_LUGARES = {
  'espejo-de-agua': {
    guardian: 'Esta es el agua abierta de la laguna. Ahí flotan las flores de loto, y nadan los patos —el pato americano y el pato jergón— y la tagua común, un ave negra de pico amarillo. ¿Cuántos puedes contar?',
    explorador: 'El espejo de agua abierta de la laguna, con flores de loto flotando en la superficie. Acá se ven el pato americano, el pato jergón y la tagua común —esta última, negra y de pico amarillo, se disputa cada rincón a los gritos.',
    guardabosques: 'Espejo de agua: la lámina abierta de la laguna, cubierta de flor de loto que flota sobre la superficie. La fauna visible aquí son el pato americano, el pato jergón y la tagua común. Es el corazón de la laguna, y la observación ciudadana es hoy su principal vigilancia.'
  },
  'ribera': {
    guardian: 'Esta es la orilla, donde el agua toca la tierra: una parte delicada del humedal. Si ves algo raro que lo pueda dañar, avísale a tu adulto.',
    explorador: 'La ribera es la frontera entre el agua y la tierra. Toda la laguna está metida en la ciudad, y en la orilla es donde más se nota ese contacto. Si ves algo que la dañe —basura, un relleno, un borde alterado—, tu reporte ayuda.',
    guardabosques: 'Ribera: la interfaz entre el agua y la tierra. Como toda la laguna está inserta en la ciudad, la orilla es donde ese contacto se hace visible; los reportes georreferenciados desde aquí aportan al seguimiento del humedal.'
  },
  'si-mirador': {
    guardian: 'Desde aquí arriba se ve todo el humedal, con la ciudad alrededor. ¿Ves cuántas casas lo rodean? También es un vecino del barrio.',
    explorador: 'Desde el mirador, Santa Inés aparece rodeado de calles, casas y un colegio. Desde la altura se entiende algo clave: no es un sitio eriazo, es un vecino vivo del barrio.',
    guardabosques: 'Santa Inés desde la altura: un humedal urbano inserto en plena matriz de la ciudad. La urbanización fragmenta el hábitat, pero también acerca observadores: cada vecino que mira es vigilancia potencial.'
  },
  'si-totoral': {
    guardian: 'Este mar de juncos dorados parece dormido en invierno… ¡pero está lleno de vida escondida! Mira despacito y la vas a descubrir.',
    explorador: 'El corazón del totoral. En invierno se ve dorado y quieto, pero entre los junquillos esperan nidos, anfibios e insectos a que llegue la primavera. Acá lo pequeño manda.',
    guardabosques: 'Junquillal denso: refugio y sitio de nidificación. La senescencia invernal es parte del ciclo — la biomasa seca protege el rebrote y a la fauna. Donde el ojo ve «campo seco», el humedal sigue trabajando.'
  },
  'si-borde': {
    guardian: 'Aquí el humedal toca la calle, y ese canalito se lleva su agua: es la parte más frágil. Si ves algo que lo dañe, avísale a tu adulto.',
    explorador: 'El borde: la calle, los autos y el canal de drenaje que aprietan al humedal. Antes era más ancho. Es la primera línea de pérdida — si ves algo que lo dañe, acá tu reporte importa más que en ningún lado.',
    guardabosques: 'Interfaz humedal-ciudad: drenaje, relleno histórico y presión inmobiliaria. Los bordes son la primera línea de pérdida de superficie; reportar aquí tiene el máximo valor.'
  },
  'si-salida': {
    guardian: 'Aquí el humedal encuentra su salida: cuando se llena de agua, el exceso se escurre por acá hacia el río Valdivia. Es como el desagüe natural de todo Isla Teja.',
    explorador: 'Esta es la salida de la cuenca de Isla Teja hacia el río Valdivia. Cuando el humedal se satura, descarga por aquí: el agua drena hacia el río y así se regula el nivel de toda la red.',
    guardabosques: 'Punto de descarga de la cuenca de Isla Teja al río Valdivia. Al alcanzar la saturación, el humedal evacúa su excedente por aquí hacia el río: es la conexión hídrica entre la red de humedales y el sistema fluvial.'
  },
  'si-cruce': {
    guardian: 'Desde aquí se ve cómo el humedal Santa Inés se conecta con el humedal La Cancha, y asoma la iglesia de la Teja. Casi todo es vegetación de pantano, sin laguna abierta. Mira el borde junto a las casas: ahí crece la costilla de vaca, un helecho que aparece cuando el suelo se seca.',
    explorador: 'El cruce: desde aquí se ve la conexión entre el humedal Santa Inés y el humedal La Cancha, con la iglesia de la Teja de fondo. Santa Inés está poco intervenido y es mayormente palustre —vegetación de pantano, sin espejo de agua. Las casas del borde lo presionan: junto a ellas aparece la costilla de vaca (Blechnum chilense), un helecho que indica suelo más firme, señal de que ahí se perdió el agua.',
    guardabosques: 'El cruce muestra la conexión hidrológica entre el humedal La Cancha y Santa Inés, con la iglesia de la Teja como referencia. Santa Inés está poco intervenido y es predominantemente palustre, sin espejo de agua. La presión viene de las casas del borde: allí aparecen especies indicadoras de suelo firme como Blechnum chilense (costilla de vaca), un helecho que señala la pérdida de lámina de agua y la consolidación del sustrato.'
  }
};

// Narracion de una estacion: el avatar ELEGIDO entrega directo el contenido de
// lugar (PH_LUGARES), sin volver a presentarse. Devuelve { texto, quien }.
function phNarrarEstacion(slug) {
  var perfil = PH_PERFIL || 'guardabosques';
  return { texto: (PH_LUGARES[slug] || {})[perfil] || '', quien: phCompanero() };
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

/* -------- Ocultar / mostrar al guía ---------------------------------------
   Un botón fijo arriba a la derecha oculta el avatar por completo: el personaje
   y su globo desaparecen y el guía no vuelve a aparecer al cambiar de humedal.
   El botón pasa a "Mostrar guía". La preferencia se recuerda entre sesiones. */
var PH_ICO_OJO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var PH_ICO_OJO_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a15.5 15.5 0 0 1-3.1 3.9M6.6 6.6A15.5 15.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/></svg>';

function phGuiaOculta() { return localStorage.getItem('ph_guia_oculta') === '1'; }
function phSetGuiaOculta(v) {
  localStorage.setItem('ph_guia_oculta', v ? '1' : '0');
  var box = document.getElementById('ph-avatar');
  if (box) box.hidden = !!v;
  phActualizarToggle();
}
function phToggleGuia() { phSetGuiaOculta(!phGuiaOculta()); }
function phActualizarToggle() {
  var b = document.getElementById('ph-guia-toggle');
  if (!b) return;
  var oculta = phGuiaOculta();
  b.classList.toggle('is-oculta', oculta);
  b.querySelector('.ico').innerHTML = oculta ? PH_ICO_OJO : PH_ICO_OJO_OFF;
  b.querySelector('.tx').textContent = oculta ? 'Mostrar guía' : 'Ocultar guía';
  b.setAttribute('aria-label', oculta ? 'Mostrar la guía' : 'Ocultar la guía');
}
function phMontarToggleGuia() {
  if (document.getElementById('ph-guia-toggle')) return;
  var b = document.createElement('button');
  b.id = 'ph-guia-toggle';
  b.className = 'ph-guia-toggle';
  b.type = 'button';
  b.innerHTML = '<span class="ico"></span><span class="tx"></span>';
  document.body.appendChild(b);
  b.addEventListener('click', phToggleGuia);
  phActualizarToggle();
}

/* -------- Widget flotante -------------------------------------------------- */
var phQuienActual = null;
var phTypeTimer = null;

function phMontarAvatar() {
  phMontarToggleGuia();
  if (document.getElementById('ph-avatar')) return;
  phQuienActual = phCompanero();
  var box = document.createElement('div');
  box.id = 'ph-avatar';
  box.className = 'ph-avatar';
  if (phGuiaOculta()) box.hidden = true;
  box.innerHTML =
    '<div class="ph-avatar__globo" id="ph-avatar-globo" hidden>' +
    '<strong id="ph-avatar-nombre"></strong>' +
    '<span id="ph-avatar-texto"></span>' +
    '</div>' +
    '<div class="ph-avatar__cw">' +
    '<button class="ph-avatar__cara" id="ph-avatar-cara" aria-label="Hablar con tu compañero">' +
    PH_PERSONAJES[phQuienActual].svg +
    '</button>' +
    '</div>';
  document.body.appendChild(box);
  document.getElementById('ph-avatar-cara').addEventListener('click', function () {
    var globo = document.getElementById('ph-avatar-globo');
    // Si hay un relato esperando y el globo está cerrado, lo cuenta. Si no,
    // el toque simplemente abre o cierra lo último que dijo.
    if (globo.hidden && phPendiente) {
      phDecir(phPendiente.texto, { quien: phPendiente.quien });
      return;
    }
    globo.hidden = !globo.hidden;
  });
}

/* Deja el relato LISTO PERO CALLADO: el habitante aparece y no dice nada hasta
   que lo tocás. Se usa en el tour, donde el visitante suele querer mirar el
   paisaje y no leer. `phDecir` sigue existiendo para lo que sí debe hablar
   solo (una bienvenida, la respuesta a una acción del usuario). */
var phPendiente = null;

function phPreparar(texto, opts) {
  opts = opts || {};
  phMontarAvatar();
  if (phGuiaOculta() || !texto) return;
  phCambiarPersonaje(opts.quien || phCompanero());
  var globo = document.getElementById('ph-avatar-globo');
  if (globo) globo.hidden = true;
  phPendiente = { texto: texto, quien: opts.quien };
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
  if (phGuiaOculta()) return;   // guía oculta: no aparece ni habla
  if (!texto) return;
  phPendiente = { texto: texto, quien: opts.quien };   // se puede volver a pedir
  phCambiarPersonaje(opts.quien || phCompanero());
  var p = PH_PERSONAJES[phQuienActual];
  var globo = document.getElementById('ph-avatar-globo');
  var nombre = document.getElementById('ph-avatar-nombre');
  var cuerpo = document.getElementById('ph-avatar-texto');
  var cara = document.getElementById('ph-avatar-cara');
  nombre.textContent = p.nombre;
  clearInterval(phTypeTimer);
  globo.hidden = false;
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

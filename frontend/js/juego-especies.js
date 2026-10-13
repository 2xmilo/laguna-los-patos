/* ==========================================================================
   MINI-JUEGO DE RECONOCIMIENTO DE ESPECIES · iNaturalist (reutilizable)
   Muestra una foto real de una especie del humedal y hay que elegir su nombre.
   · observar.html (para todas las edades, se llega desde Descubre o desde el
     humedal): con álbum coleccionable + puntos solo en terreno.
   · El modo sin álbum (racha) queda disponible para otros usos.
   Requiere biodiversidad.js (phEspeciesDe, phFotoTaxon, phNombreTaxon) y
   avatar.js (phDecir). Si conPuntos, también puntos.js (phSumarPuntos).

   phMontarJuego({
     humedalId, foto, opciones,          // ids o elementos
     album,                              // id/elemento del álbum (opcional)
     racha,                              // id/elemento contador (opcional)
     conPuntos,                          // default false; suma solo si dentroFn()
     dentroFn                            // () => bool (está en el polígono)
   })
   ========================================================================== */
function phMontarJuego(opts) {
  function el(x) { return typeof x === 'string' ? document.getElementById(x) : x; }
  var foto = el(opts.foto), opciones = el(opts.opciones);
  var albumEl = opts.album ? el(opts.album) : null;
  var rachaEl = opts.racha ? el(opts.racha) : null;
  var humedalId = opts.humedalId;
  var conPuntos = !!opts.conPuntos;
  var dentroFn = opts.dentroFn || function () { return false; };
  if (!foto || !opciones) return;

  // Reino a partir del grupo iónico de iNaturalist (para no mezclar plantas con
  // animales cuando no alcanzan distractores del mismo grupo fino).
  function reino(g) {
    if (g === 'Plantae' || g === 'Fungi' || g === 'Protozoa' || g === 'Chromista') return g;
    return 'Animalia';
  }
  var ESPECIES = [], pendientes = [], actual = null, aciertos = 0;

  var lastBig = null; // foto grande de la especie actual (para ampliar)

  function esUrl(f) { return f && /^https?:/.test(f); }
  function barajar(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
  function album() { return JSON.parse(localStorage.getItem('ph_album') || '[]'); }
  function pegar(id) { var a = album(); if (a.indexOf(id) < 0) { a.push(id); localStorage.setItem('ph_album', JSON.stringify(a)); } }

  // Ampliar la foto: a veces la observación de iNaturalist no enfoca bien a la
  // especie; tocando el círculo se ve en grande.
  function abrirLightbox(url) {
    if (!url) return;
    var lb = document.getElementById('ph-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'ph-lightbox'; lb.className = 'ph-lightbox';
      lb.innerHTML = '<img alt="Especie ampliada"><span class="ph-lightbox__x" aria-hidden="true">✕</span>';
      document.body.appendChild(lb);
      lb.addEventListener('click', function () { lb.classList.remove('on'); });
    }
    lb.querySelector('img').src = url;
    lb.classList.add('on');
  }

  function mostrarFoto(elm, f) {
    if (esUrl(f)) { elm.classList.add('obs-foto--img'); elm.textContent = ''; elm.style.backgroundImage = "url('" + f + "')"; }
    else { elm.classList.remove('obs-foto--img'); elm.style.backgroundImage = ''; elm.textContent = f || '❓'; }
  }

  function pintarAlbum() {
    if (!albumEl) return;
    var a = album();
    albumEl.innerHTML = ESPECIES.map(function (e) {
      var t = a.indexOf(e.id) >= 0;
      var vis = (t && esUrl(e.foto))
        ? '<span class="st obs-foto--img" style="background-image:url(\'' + e.foto + '\')"></span>'
        : '<span class="st">' + (t ? e.foto : '❓') + '</span>';
      return '<div class="alb-item' + (t ? ' tengo' : '') + '">' + vis + '<small>' + (t ? e.nombre : '¿?') + '</small></div>';
    }).join('');
  }
  function pintarRacha() { if (rachaEl) rachaEl.textContent = aciertos ? ('Reconocidas: ' + aciertos) : ''; }

  function ronda() {
    if (!ESPECIES.length) return;
    if (!pendientes.length) pendientes = barajar(ESPECIES);
    actual = pendientes.shift();
    // Cada vez una foto distinta de la especie, tomada en este humedal.
    var f = actual.fotos[Math.floor(Math.random() * actual.fotos.length)];
    mostrarFoto(foto, f);
    lastBig = f.replace('/medium.', '/large.');
    // Distractores coherentes: primero del mismo grupo (ave con ave, planta con
    // planta…); si no hay 2, del mismo reino; y recién al final, cualquiera.
    var otros = ESPECIES.filter(function (e) { return e.id !== actual.id; });
    var mismoGrupo = otros.filter(function (e) { return e.grupo === actual.grupo; });
    var mismoReino = otros.filter(function (e) { return e.grupo !== actual.grupo && reino(e.grupo) === reino(actual.grupo); });
    var resto = otros.filter(function (e) { return reino(e.grupo) !== reino(actual.grupo); });
    var distract = barajar(mismoGrupo).concat(barajar(mismoReino)).concat(barajar(resto)).slice(0, 2);
    opciones.innerHTML = barajar([actual].concat(distract)).map(function (o) {
      return '<button class="obs-op" data-e="' + o.id + '">' + o.nombre + '</button>';
    }).join('');
    opciones.querySelectorAll('.obs-op').forEach(function (b) {
      b.addEventListener('click', function () { responder(b); });
    });
  }

  function responder(b) {
    if (b.dataset.e === actual.id) {
      b.classList.add('ok');
      aciertos++;
      var msj = '¡Sí! Es ' + actual.nombre + '.';
      if (albumEl) {
        var nuevo = album().indexOf(actual.id) < 0;
        pegar(actual.id); pintarAlbum();
        if (nuevo) msj += ' Se pegó en tu álbum ⭐';
        if (nuevo && conPuntos && dentroFn()) { var g = phSumarPuntos('reconocer'); msj += ' Y como estás en el humedal, ganaste +' + g + ' puntos.'; }
      } else {
        pintarRacha();
        if (conPuntos && dentroFn()) { var g2 = phSumarPuntos('reconocer'); msj += ' +' + g2 + ' puntos por estar en terreno.'; }
      }
      if (typeof phDecir === 'function') phDecir(msj);
      setTimeout(ronda, 1400);
    } else {
      b.classList.add('mal');
      if (typeof phDecir === 'function') phDecir('Mmm, no… mira bien y prueba de nuevo. La paciencia es la mejor lupa.');
    }
  }

  // Tap en la foto → verla en grande. Botón para saltar imágenes poco claras.
  foto.addEventListener('click', function () { abrirLightbox(lastBig); });
  var skip = document.createElement('button');
  skip.className = 'obs-skip'; skip.type = 'button';
  skip.textContent = 'No se ve bien · ver otra';
  opciones.parentNode.insertBefore(skip, opciones.nextSibling);
  skip.addEventListener('click', function () { if (typeof phDecir === 'function') phDecir('Va otra especie del humedal.'); ronda(); });

  // Sin plan B inventado: si no hay especies reales, se dice tal cual.
  function aviso(texto, conReintento) {
    mostrarFoto(foto, '🔎');
    skip.style.display = 'none';
    opciones.innerHTML = '<p style="text-align:center;color:var(--tinta-suave);font-size:13px;">' + texto + '</p>' +
      (conReintento ? '<button class="obs-op" type="button" id="j-reintentar">Reintentar</button>' : '');
    var b = document.getElementById('j-reintentar');
    if (b) b.addEventListener('click', cargar);
  }

  function cargar() {
    skip.style.display = 'none';
    opciones.innerHTML = '<p style="text-align:center;color:var(--tinta-suave);font-size:13px;">Buscando las especies del humedal…</p>';
    phEspeciesDe(humedalId).then(function (lista) {
      // Todas las especies del humedal, no solo las más registradas: así cada
      // partida pregunta especies distintas, en orden aleatorio.
      var reales = (lista || []).map(function (r) {
        var principal = phFotoTaxon(r.taxon, 'medium');
        var fotos = r.fotos && r.fotos.length ? r.fotos : (principal ? [principal] : []);
        return { id: 't' + r.taxon.id, foto: principal || fotos[0], fotos: fotos,
                 nombre: phNombreTaxon(r.taxon), grupo: r.taxon.iconic_taxon_name || 'Otros' };
      }).filter(function (e) { return e.fotos.length; });
      // Solo preguntamos especies cuyo REINO tenga al menos 3 miembros, para poder
      // armar siempre 3 opciones del mismo reino (nunca planta vs animal). Las de
      // reinos con 1-2 miembros (p.ej. un hongo suelto) quedan fuera del quiz.
      var porReino = {};
      reales.forEach(function (e) { var k = reino(e.grupo); porReino[k] = (porReino[k] || 0) + 1; });
      var jugables = reales.filter(function (e) { return porReino[reino(e.grupo)] >= 3; });
      ESPECIES = jugables.length >= 3 ? jugables : (reales.length >= 3 ? reales : []);
      if (!ESPECIES.length) { aviso('Todavía no hay suficientes especies registradas en este humedal para jugar.', false); return; }
      pendientes = [];
      skip.style.display = '';
      pintarAlbum(); pintarRacha(); ronda();
    }).catch(function () { aviso('No se pudieron cargar las especies. Revisa tu conexión.', true); });
  }
  cargar();
}

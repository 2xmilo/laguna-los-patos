/* ==========================================================================
   MINI-JUEGO DE RECONOCIMIENTO DE ESPECIES · iNaturalist (reutilizable)
   Muestra una foto real de una especie del humedal y hay que elegir su nombre.
   · Guardián (observar.html): con álbum coleccionable + puntos en terreno.
   · Perfiles 2 y 3 (avistar.html): sin álbum, solo práctica (con racha).
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

  /* Fallback honesto si falla la red: solo especies que sí están (nunca cisne/monito). */
  var FALLBACK = [
    { id: 'f-pato', foto: '🦆', nombre: 'Pato jergón' },
    { id: 'f-tagua', foto: '🐦‍⬛', nombre: 'Tagua' },
    { id: 'f-piden', foto: '🐦', nombre: 'Pidén' },
    { id: 'f-garza', foto: '🕊️', nombre: 'Garza grande' }
  ];
  var ESPECIES = [], pendientes = [], actual = null, aciertos = 0;

  function esUrl(f) { return f && /^https?:/.test(f); }
  function barajar(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
  function album() { return JSON.parse(localStorage.getItem('ph_album') || '[]'); }
  function pegar(id) { var a = album(); if (a.indexOf(id) < 0) { a.push(id); localStorage.setItem('ph_album', JSON.stringify(a)); } }

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
    mostrarFoto(foto, actual.foto);
    var distract = barajar(ESPECIES.filter(function (e) { return e.id !== actual.id; })).slice(0, 2);
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
      if (typeof phDecir === 'function') phDecir('Mmm, no… mirá bien y probá de nuevo. La paciencia es la mejor lupa.');
    }
  }

  opciones.innerHTML = '<p style="text-align:center;color:var(--tinta-suave);font-size:13px;">Buscando las especies del humedal…</p>';
  phEspeciesDe(humedalId).then(function (lista) {
    var reales = (lista || [])
      .map(function (r) { return { id: 't' + r.taxon.id, foto: phFotoTaxon(r.taxon, 'medium'), nombre: phNombreTaxon(r.taxon) }; })
      .filter(function (e) { return e.foto; })
      .slice(0, 10);
    ESPECIES = reales.length >= 3 ? reales : FALLBACK;
    pintarAlbum(); pintarRacha(); ronda();
  }).catch(function () { ESPECIES = FALLBACK; ronda(); });
}

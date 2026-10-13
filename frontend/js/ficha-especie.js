/* ==========================================================================
   FICHA DE ESPECIE · hoja inferior con la ficha de iNaturalist (reutilizable)
   Foto grande, estado de conservación (IUCN), taxonomía, resumen de Wikipedia
   y cuántas observaciones hay en el humedal y en el mundo. La usan Descubre y
   Avistar. Arma su propio HTML la primera vez que se abre: la página solo
   carga css/biodiversidad.css y este archivo.
   Requiere biodiversidad.js (phFichaTaxon, phFotoTaxon, phNombreTaxon).

   phAbrirFicha({ taxon, count })   // un elemento de phEspeciesDe()
   ========================================================================== */
(function () {
  var ESTADOS = { LC: ['Preocupación menor', '#4caf50'], NT: ['Casi amenazada', '#9acb3c'], VU: ['Vulnerable', '#f0a818'], EN: ['En peligro', '#e8722c'], CR: ['En peligro crítico', '#d6322b'], EW: ['Extinta en estado silvestre', '#7a3b8f'], EX: ['Extinta', '#444'], DD: ['Datos insuficientes', '#9e9e9e'] };
  var modal = null, fichaBox = null, abierta = null;

  function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }
  function limpiar(h) { var d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').trim(); }
  function chipEstado(cs) {
    if (!cs) return '';
    var c = String(cs.status || '').toUpperCase(), i = ESTADOS[c];
    return '<span class="ficha-estado" style="background:' + (i ? i[1] : '#777') + '">' + esc(i ? i[0] : (cs.status_name || c)) + '</span>';
  }
  function taxonomia(anc) {
    var q = { class: 'Clase', order: 'Orden', family: 'Familia' };
    return (anc || []).filter(function (a) { return q[a.rank]; }).map(function (a) {
      return '<span><b>' + q[a.rank] + ':</b> ' + esc(a.preferred_common_name || a.name) + '</span>';
    }).join('');
  }
  function miniaturas(tp) {
    var fs = (tp || []).map(function (x) { return x.photo && (x.photo.medium_url || x.photo.square_url); }).filter(Boolean).slice(0, 6);
    if (fs.length < 2) return '';
    return '<div class="ficha-thumbs">' + fs.map(function (u) {
      var big = u.replace('/medium.', '/large.').replace('/square.', '/large.');
      return '<img src="' + u + '" data-big="' + big + '" class="ficha-thumb" alt="">';
    }).join('') + '</div>';
  }

  function montar() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'bio-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="bio-modal__bg" data-close></div>' +
      '<div class="bio-modal__panel" role="dialog" aria-modal="true" aria-label="Ficha de la especie">' +
      '<button class="bio-modal__x" data-close aria-label="Cerrar">✕</button>' +
      '<div class="ficha"></div></div>';
    document.body.appendChild(modal);
    fichaBox = modal.querySelector('.ficha');
    modal.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', cerrar); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    // Tocar una miniatura la pone como foto grande
    fichaBox.addEventListener('click', function (e) {
      var t = e.target.closest('.ficha-thumb'); if (!t) return;
      var h = fichaBox.querySelector('.ficha-hero');
      if (h) h.style.backgroundImage = "url('" + (t.dataset.big || t.src) + "')";
    });
  }
  function cerrar() { if (modal) modal.hidden = true; abierta = null; }

  window.phAbrirFicha = function (r) {
    if (!r || !r.taxon) return;
    montar();
    abierta = r.taxon.id;
    modal.hidden = false;
    var fotoBig = phFotoTaxon(r.taxon, 'large') || phFotoTaxon(r.taxon, 'medium') || '';
    fichaBox.innerHTML = '<div class="ficha-hero" style="background-image:url(\'' + fotoBig + '\')"></div>' +
      '<div class="ficha-cuerpo"><div class="ficha-titulo"><h3>' + esc(phNombreTaxon(r.taxon)) + '</h3></div>' +
      '<p class="ficha-cargando">Cargando ficha…</p></div>';
    phFichaTaxon(r.taxon.id).then(function (t) {
      if (!t || abierta !== r.taxon.id) return;   // se cerró o se abrió otra
      var resumen = limpiar(t.wikipedia_summary);
      fichaBox.innerHTML = '<div class="ficha-hero" style="background-image:url(\'' + fotoBig + '\')"></div>' +
        '<div class="ficha-cuerpo"><div class="ficha-titulo"><h3>' + esc(phNombreTaxon(t)) + '</h3>' + chipEstado(t.conservation_status) + '</div>' +
        '<p class="ficha-sci">' + esc(t.name || '') + ' · <span class="ficha-grupo">' + esc(t.iconic_taxon_name || '') + '</span></p>' +
        miniaturas(t.taxon_photos) +
        '<div class="ficha-taxo">' + taxonomia(t.ancestors) + '</div>' +
        (resumen ? '<p class="ficha-desc">' + esc(resumen) + '</p>' : '') +
        '<div class="ficha-stats"><div><strong>' + (r.count || 0) + '</strong><span>obs. en este humedal</span></div>' +
        '<div><strong>' + (t.observations_count || 0).toLocaleString('es-CL') + '</strong><span>obs. en el mundo</span></div></div>' +
        '<a class="modal-link" href="https://www.inaturalist.org/taxa/' + t.id + '" target="_blank" rel="noopener">Ver ficha completa en iNaturalist ↗</a></div>';
    }).catch(function () {
      if (abierta !== r.taxon.id) return;
      var p = fichaBox.querySelector('.ficha-cargando');
      if (p) p.textContent = 'No se pudo cargar la ficha. Revisa tu conexión.';
    });
  };
})();

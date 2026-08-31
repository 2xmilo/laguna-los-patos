/* ==========================================================================
   BIODIVERSIDAD POR HUMEDAL · iNaturalist (API pública, sin token)
   Dado un id de humedal, trae las especies REALES observadas dentro de su
   polígono (data/humedales.geojson). Fuente única reutilizada por:
     · la galería de biodiversidad (avistar.html, perfiles 2 y 3)
     · el mini-juego "Reconocer" (observar.html, Guardianes)
   Requiere geo.js cargado antes (phFeatureDe, phEnHumedal).
   ========================================================================== */
(function () {
  var INAT_OBS = 'https://api.inaturalist.org/v1/observations';
  var cache = {};

  function bboxDe(feature) {
    var g = feature.geometry;
    var polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    var minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    polys.forEach(function (poly) {
      poly[0].forEach(function (c) {
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
        if (c[0] < minLng) minLng = c[0];
        if (c[0] > maxLng) maxLng = c[0];
      });
    });
    return { swlat: minLat, swlng: minLng, nelat: maxLat, nelng: maxLng };
  }

  function urlConsulta(bb, taxon) {
    var p = [
      'nelat=' + bb.nelat, 'nelng=' + bb.nelng,
      'swlat=' + bb.swlat, 'swlng=' + bb.swlng,
      'quality_grade=research', 'photos=true',
      'per_page=200', 'order_by=created_at', 'locale=es'
    ];
    if (taxon) p.push('iconic_taxa=' + taxon.split(',').map(encodeURIComponent).join(','));
    return INAT_OBS + '?' + p.join('&');
  }

  // Agrupa por especie SOLO las observaciones dentro del polígono real.
  function agrupar(observaciones, feature) {
    var porTaxon = {};
    observaciones.forEach(function (o) {
      var t = o.taxon, gj = o.geojson;
      if (!t || !t.id || !gj || !gj.coordinates) return;
      if (!phEnHumedal(gj.coordinates[0], gj.coordinates[1], feature)) return;
      if (!porTaxon[t.id]) porTaxon[t.id] = { taxon: t, count: 0 };
      porTaxon[t.id].count++;
    });
    return Object.keys(porTaxon)
      .map(function (k) { return porTaxon[k]; })
      .filter(function (r) { return r.taxon.default_photo; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  // Promise<[{taxon, count}]> — especies reales del humedal (opcional: iconic_taxa).
  window.phEspeciesDe = function (humedalId, taxon) {
    var key = humedalId + '|' + (taxon || '');
    if (cache[key]) return Promise.resolve(cache[key]);
    return phFeatureDe(humedalId).then(function (feature) {
      if (!feature) return [];
      return fetch(urlConsulta(bboxDe(feature), taxon))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var res = agrupar(data.results || [], feature);
          cache[key] = res;
          return res;
        });
    });
  };

  // Promise<taxon detallado> para la ficha (Wikipedia, IUCN, taxonomía…).
  var fichaCache = {};
  window.phFichaTaxon = function (taxonId) {
    if (fichaCache[taxonId]) return Promise.resolve(fichaCache[taxonId]);
    return fetch('https://api.inaturalist.org/v1/taxa/' + taxonId + '?locale=es')
      .then(function (r) { return r.json(); })
      .then(function (data) { var t = (data.results || [])[0]; if (t) fichaCache[taxonId] = t; return t; });
  };

  // Helpers de presentación
  window.phFotoTaxon = function (taxon, size) {
    var f = taxon && taxon.default_photo;
    if (!f) return null;
    var base = f.medium_url || f.square_url || f.url || '';
    if (!base) return null;
    if (size === 'large') return base.replace('/medium.', '/large.').replace('/square.', '/large.');
    return base;
  };
  window.phNombreTaxon = function (taxon) {
    return taxon.preferred_common_name || taxon.name || 'Especie';
  };
})();

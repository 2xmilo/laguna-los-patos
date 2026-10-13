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
  var POR_PAGINA = 200;      // máximo que permite la API
  var MAX_PROFUNDIDAD = 4;   // cuántas veces se puede dividir un cuadro en 4
  var MAX_PAGINAS = 5;       // tope de páginas en un cuadro que ya no se divide
  var FOTOS_POR_ESPECIE = 12;
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

  function urlConsulta(bb, taxon, pagina) {
    var p = [
      'nelat=' + bb.nelat, 'nelng=' + bb.nelng,
      'swlat=' + bb.swlat, 'swlng=' + bb.swlng,
      'quality_grade=research', 'photos=true',
      'per_page=' + POR_PAGINA, 'page=' + pagina, 'order_by=created_at', 'locale=es'
    ];
    if (taxon) p.push('iconic_taxa=' + taxon.split(',').map(encodeURIComponent).join(','));
    return INAT_OBS + '?' + p.join('&');
  }

  // Agrupa por especie SOLO las observaciones dentro del polígono real. Junta
  // además las fotos de esas observaciones: son fotos tomadas EN este humedal,
  // y el mini-juego las alterna para no mostrar siempre la misma.
  function agrupar(observaciones, feature) {
    var porTaxon = {};
    observaciones.forEach(function (o) {
      var t = o.taxon, gj = o.geojson;
      if (!t || !t.id || !gj || !gj.coordinates) return;
      if (!phEnHumedal(gj.coordinates[0], gj.coordinates[1], feature)) return;
      if (!porTaxon[t.id]) porTaxon[t.id] = { taxon: t, count: 0, fotos: [] };
      var r = porTaxon[t.id];
      r.count++;
      var f = o.photos && o.photos[0] && o.photos[0].url;
      if (f && r.fotos.length < FOTOS_POR_ESPECIE) r.fotos.push(f.replace('/square.', '/medium.'));
    });
    return Object.keys(porTaxon)
      .map(function (k) { return porTaxon[k]; })
      .filter(function (r) { return r.taxon.default_photo || r.fotos.length; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  /* -------- ¿Un cuadro toca el polígono? ----------------------------------
     iNaturalist solo acepta rectángulos. Para un humedal grande e irregular
     (el Santuario) el rectángulo que lo contiene abarca media ciudad, así que
     se divide en cuadros y solo se consultan los que tocan el polígono. */
  function segmentosSeCruzan(a, b, c, d) {
    function lado(p, q, r) { return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); }
    var d1 = lado(c, d, a), d2 = lado(c, d, b), d3 = lado(a, b, c), d4 = lado(a, b, d);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
  }
  function cuadroTocaPoligono(bb, feature) {
    var esquinas = [[bb.swlng, bb.swlat], [bb.nelng, bb.swlat], [bb.nelng, bb.nelat], [bb.swlng, bb.nelat]];
    // Una esquina (o el centro) del cuadro cae dentro del humedal
    if (phEnHumedal((bb.swlng + bb.nelng) / 2, (bb.swlat + bb.nelat) / 2, feature)) return true;
    for (var i = 0; i < 4; i++) if (phEnHumedal(esquinas[i][0], esquinas[i][1], feature)) return true;
    var g = feature.geometry;
    var polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    for (var p = 0; p < polys.length; p++) {
      var anillo = polys[p][0];
      for (var k = 0; k < anillo.length - 1; k++) {
        var v = anillo[k];
        // Un vértice del humedal cae dentro del cuadro…
        if (v[0] >= bb.swlng && v[0] <= bb.nelng && v[1] >= bb.swlat && v[1] <= bb.nelat) return true;
        // …o un borde del humedal cruza un borde del cuadro
        for (var e = 0; e < 4; e++) {
          if (segmentosSeCruzan(v, anillo[k + 1], esquinas[e], esquinas[(e + 1) % 4])) return true;
        }
      }
    }
    return false;
  }
  function dividir(bb) {
    var mlat = (bb.swlat + bb.nelat) / 2, mlng = (bb.swlng + bb.nelng) / 2;
    return [
      { swlat: bb.swlat, swlng: bb.swlng, nelat: mlat, nelng: mlng },
      { swlat: bb.swlat, swlng: mlng, nelat: mlat, nelng: bb.nelng },
      { swlat: mlat, swlng: bb.swlng, nelat: bb.nelat, nelng: mlng },
      { swlat: mlat, swlng: mlng, nelat: bb.nelat, nelng: bb.nelng }
    ];
  }

  // Promise<[{taxon, count, fotos}]> — especies reales del humedal (opcional:
  // iconic_taxa). Se pide el rectángulo del humedal; si trae más de una página
  // (200 obs.), se divide en 4 y se repite solo con los cuadros que tocan el
  // polígono, hasta MAX_PROFUNDIDAD. Un humedal chico sigue siendo UNA consulta.
  // Si falla un cuadro secundario se sigue con lo que llegó; si falla la
  // primera consulta, la promesa se rechaza y cada pantalla muestra su aviso.
  window.phEspeciesDe = function (humedalId, taxon) {
    var key = humedalId + '|' + (taxon || '');
    if (cache[key]) return Promise.resolve(cache[key]);
    return phFeatureDe(humedalId).then(function (feature) {
      if (!feature) return [];
      function pedir(bb, n) {
        return fetch(urlConsulta(bb, taxon, n)).then(function (r) {
          if (!r.ok) throw new Error('iNaturalist ' + r.status);
          return r.json();
        });
      }
      function cuadro(bb, nivel, primero) {
        var p1 = pedir(bb, 1);
        if (!primero) p1 = p1.catch(function () { return { results: [], total_results: 0 }; });
        return p1.then(function (d) {
          var obs = d.results || [], total = d.total_results || 0;
          if (total <= POR_PAGINA) return obs;
          if (nivel < MAX_PROFUNDIDAD) {
            var hijos = dividir(bb).filter(function (h) { return cuadroTocaPoligono(h, feature); });
            return Promise.all(hijos.map(function (h) { return cuadro(h, nivel + 1, false); }))
              .then(function (listas) { return [].concat.apply([], listas); });
          }
          // Ya no se divide más: se completan páginas hasta MAX_PAGINAS
          var resto = [];
          for (var n = 2; n <= Math.min(MAX_PAGINAS, Math.ceil(total / POR_PAGINA)); n++) {
            resto.push(pedir(bb, n).catch(function () { return { results: [] }; }));
          }
          return Promise.all(resto).then(function (otras) {
            otras.forEach(function (x) { obs = obs.concat(x.results || []); });
            return obs;
          });
        });
      }
      return cuadro(bboxDe(feature), 0, true).then(function (obs) {
        // Una observación justo en el borde entre dos cuadros puede llegar dos veces
        var vistos = {};
        obs = obs.filter(function (o) { if (vistos[o.id]) return false; vistos[o.id] = true; return true; });
        var res = agrupar(obs, feature);
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

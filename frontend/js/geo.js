/* Point-in-polygon para validar que el usuario está dentro del humedal.
   Trabaja sobre el GeoJSON (WGS84) ya cargado. */
function phPuntoEnAnillo(lon, lat, anillo) {
  var dentro = false;
  for (var i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    var xi = anillo[i][0], yi = anillo[i][1];
    var xj = anillo[j][0], yj = anillo[j][1];
    var cruza = ((yi > lat) !== (yj > lat)) &&
                (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (cruza) dentro = !dentro;
  }
  return dentro;
}
function phEnHumedal(lon, lat, feature) {
  var g = feature.geometry;
  var polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
  for (var p = 0; p < polys.length; p++) {
    var ext = polys[p][0];
    if (phPuntoEnAnillo(lon, lat, ext)) {
      var enHueco = false;
      for (var k = 1; k < polys[p].length; k++) {
        if (phPuntoEnAnillo(lon, lat, polys[p][k])) { enHueco = true; break; }
      }
      if (!enHueco) return true;
    }
  }
  return false;
}
async function phFeatureDe(id) {
  var geo = await (await fetch('data/humedales.geojson')).json();
  return geo.features.find(function (f) { return f.properties.id === id; });
}

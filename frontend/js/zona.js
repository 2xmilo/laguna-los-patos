/* ==========================================================================
   ZONA · polígono de la Laguna Los Patos (desde "Laguna de los patos.kmz")
   Coordenadas [lng, lat]. Se usa para filtrar las especies de iNaturalist
   que caen DENTRO del polígono (no solo en el rectángulo).
   ========================================================================== */
var ZONA_POLIGONO = [
    [-73.25730329493952, -39.80980844281112],
    [-73.25684683759845, -39.81008562919244],
    [-73.25614237555732, -39.81021275860216],
    [-73.25561124980997, -39.81032433619971],
    [-73.25518890021290, -39.81039517335045],
    [-73.25498449563068, -39.81012927858072],
    [-73.25691254011029, -39.80934682127272],
    [-73.25730329493952, -39.80980844281112]
];

// Bounding box (para acotar la consulta a iNaturalist antes de filtrar)
var ZONA_BBOX = {
    swlat: -39.81039517335045, swlng: -73.25730329493952,
    nelat: -39.80934682127272, nelng: -73.25498449563068
};

// Punto dentro de polígono (ray casting). lng, lat en grados.
function puntoEnZona(lng, lat) {
    var p = ZONA_POLIGONO, dentro = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
        var xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
        var cruza = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (cruza) dentro = !dentro;
    }
    return dentro;
}

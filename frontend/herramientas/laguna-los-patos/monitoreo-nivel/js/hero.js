/* ==========================================================================
   HERO · fondo dinámico con una foto real de la zona (iNaturalist)
   Se aplica como textura bajo el degradado verde; siempre legible.
   ========================================================================== */
(function () {
    if (typeof LAGUNA_LAT === 'undefined') return;
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var radius = (typeof INAT_RADIUS_KM !== 'undefined') ? INAT_RADIUS_KM : 5;
    var url = 'https://api.inaturalist.org/v1/observations' +
        '?lat=' + LAGUNA_LAT + '&lng=' + LAGUNA_LON + '&radius=' + radius +
        '&photos=true&iconic_taxa=Aves,Plantae&quality_grade=research' +
        '&order_by=votes&per_page=20&locale=es';

    fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (d) {
            var obs = (d.results || []).filter(function (o) { return o.photos && o.photos.length; });
            if (!obs.length) return;
            // elige al azar entre las más votadas para que varíe en cada carga
            var pick = obs[Math.floor(Math.random() * Math.min(obs.length, 10))];
            var foto = pick.photos[0];
            var u = (foto.url || '').replace('/square.', '/large.');
            if (!u) return;
            var img = new Image();
            img.onload = function () {
                hero.style.setProperty('--hero-photo', "url('" + u + "')");
            };
            img.src = u; // precarga: evita parpadeo
        })
        .catch(function () { /* respaldo verde sólido */ });
})();

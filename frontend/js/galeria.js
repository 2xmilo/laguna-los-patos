/* ==========================================================================
   GALERÍA DE BIODIVERSIDAD · iNaturalist (API pública, sin key)
   Muestra las especies observadas alrededor de la Laguna Los Patos.
   ========================================================================== */
(function () {
    function $(id) { return document.getElementById(id); }

    var INAT_OBS = 'https://api.inaturalist.org/v1/observations';
    var taxonActivo = '';
    var cache = {}; // por taxon, para no repetir llamadas

    function urlConsulta(taxon) {
        // Acotamos al bounding box del polígono; el filtro fino lo hace puntoEnZona().
        var p = [
            'nelat=' + ZONA_BBOX.nelat, 'nelng=' + ZONA_BBOX.nelng,
            'swlat=' + ZONA_BBOX.swlat, 'swlng=' + ZONA_BBOX.swlng,
            'quality_grade=research',
            'photos=true',
            'per_page=200',
            'order_by=created_at',
            'locale=es'
        ];
        if (taxon) {
            // taxon puede traer varios grupos separados por coma (ej. "Fauna")
            var grupos = taxon.split(',').map(encodeURIComponent).join(',');
            p.push('iconic_taxa=' + grupos);
        }
        return INAT_OBS + '?' + p.join('&');
    }

    // Agrupa observaciones (dentro del polígono) por especie → [{taxon, count}]
    function agruparPorEspecie(observaciones) {
        var porTaxon = {};
        observaciones.forEach(function (o) {
            var t = o.taxon;
            if (!t || !t.id) return;
            var g = o.geojson;            // {coordinates:[lng,lat]}
            if (!g || !g.coordinates) return;
            if (!puntoEnZona(g.coordinates[0], g.coordinates[1])) return;
            if (!porTaxon[t.id]) porTaxon[t.id] = { taxon: t, count: 0 };
            porTaxon[t.id].count++;
        });
        return Object.keys(porTaxon)
            .map(function (k) { return porTaxon[k]; })
            .filter(function (r) { return r.taxon.default_photo; })
            .sort(function (a, b) { return b.count - a.count; });
    }

    function setStatus(msg) {
        var el = $('status-bio');
        if (!el) return;
        el.textContent = msg || '';
        el.style.display = msg ? 'block' : 'none';
    }

    function fotoUrl(taxon, size) {
        var f = taxon && taxon.default_photo;
        if (!f) return null;
        var base = f.medium_url || f.square_url || f.url || '';
        if (!base) return null;
        if (size === 'large') return base.replace('/medium.', '/large.').replace('/square.', '/large.');
        return base;
    }

    function nombre(taxon) {
        return taxon.preferred_common_name ||
               (taxon.name ? taxon.name : 'Especie sin nombre');
    }

    function render(resultados) {
        var grid = $('galeria');
        if (!resultados.length) {
            grid.innerHTML = '';
            setStatus('No hay especies registradas para este grupo en la zona.');
            return;
        }
        setStatus('');
        grid.innerHTML = resultados.map(function (r, i) {
            var t = r.taxon;
            var foto = fotoUrl(t, 'medium');
            if (!foto) return '';
            var comun = nombre(t);
            var sci = t.name || '';
            return '' +
                '<button class="bio-card" data-i="' + i + '">' +
                    '<div class="bio-foto" style="background-image:url(\'' + foto + '\')"></div>' +
                    '<div class="bio-info">' +
                        '<span class="bio-nombre">' + comun + '</span>' +
                        '<span class="bio-sci">' + sci + '</span>' +
                        '<span class="bio-count">' + r.count + ' obs.</span>' +
                    '</div>' +
                '</button>';
        }).join('');

        // guardar para el modal
        grid._data = resultados;
    }

    /* ── Ficha técnica: se arma con /v1/taxa/{id} (cliente, sin backend) ── */
    var fichaCache = {};

    function escape(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function quitarHtml(html) {
        var d = document.createElement('div');
        d.innerHTML = html || '';
        return (d.textContent || '').trim();
    }

    // Estados de conservación IUCN → etiqueta + color
    var ESTADOS = {
        LC: ['Preocupación menor', '#4caf50'], NT: ['Casi amenazada', '#9acb3c'],
        VU: ['Vulnerable', '#f0a818'], EN: ['En peligro', '#e8722c'],
        CR: ['En peligro crítico', '#d6322b'], EW: ['Extinta en estado silvestre', '#7a3b8f'],
        EX: ['Extinta', '#444'], DD: ['Datos insuficientes', '#9e9e9e']
    };

    function chipEstado(cs) {
        if (!cs) return '';
        var code = String(cs.status || '').toUpperCase();
        var info = ESTADOS[code];
        var label = info ? info[0] : (cs.status_name || code);
        var color = info ? info[1] : '#777';
        return '<span class="ficha-estado" style="background:' + color + '">' +
            escape(label) + '</span>';
    }

    function taxonomia(ancestros) {
        var quiero = { class: 'Clase', order: 'Orden', family: 'Familia' };
        return (ancestros || []).filter(function (a) { return quiero[a.rank]; })
            .map(function (a) {
                var n = a.preferred_common_name || a.name;
                return '<span><b>' + escape(quiero[a.rank]) + ':</b> ' + escape(n) + '</span>';
            }).join('');
    }

    function thumbs(taxon_photos, mainUrl) {
        var fotos = (taxon_photos || []).map(function (tp) {
            return tp.photo && (tp.photo.medium_url || tp.photo.square_url);
        }).filter(Boolean).slice(0, 6);
        if (fotos.length < 2) return '';
        return '<div class="ficha-thumbs">' + fotos.map(function (u) {
            var big = u.replace('/medium.', '/large.').replace('/square.', '/large.');
            return '<img src="' + u + '" data-big="' + big + '" class="ficha-thumb">';
        }).join('') + '</div>';
    }

    function renderFicha(r, t) {
        var fotoBig = fotoUrl(r.taxon, 'large') || fotoUrl(r.taxon, 'medium') || '';
        var resumen = quitarHtml(t.wikipedia_summary);
        var html =
            '<div class="ficha-hero" style="background-image:url(\'' + fotoBig + '\')" id="ficha-hero"></div>' +
            '<div class="ficha-cuerpo">' +
                '<div class="ficha-titulo">' +
                    '<h3>' + escape(nombre(t)) + '</h3>' + chipEstado(t.conservation_status) +
                '</div>' +
                '<p class="ficha-sci">' + escape(t.name || '') +
                    ' · <span class="ficha-grupo">' + escape(t.iconic_taxon_name || '') + '</span></p>' +
                thumbs(t.taxon_photos, fotoBig) +
                '<div class="ficha-taxo">' + taxonomia(t.ancestors) + '</div>' +
                (resumen ? '<p class="ficha-desc">' + escape(resumen) + '</p>' : '') +
                '<div class="ficha-stats">' +
                    '<div><strong>' + r.count + '</strong><span>obs. en la laguna</span></div>' +
                    '<div><strong>' + (t.observations_count || 0).toLocaleString('es-CL') +
                        '</strong><span>obs. en el mundo</span></div>' +
                '</div>' +
                '<a class="modal-link" href="https://www.inaturalist.org/taxa/' + t.id +
                    '" target="_blank" rel="noopener">Ver ficha completa en iNaturalist ↗</a>' +
            '</div>';
        $('ficha').innerHTML = html;
    }

    function abrirFicha(r) {
        $('modal').hidden = false;
        var fotoBig = fotoUrl(r.taxon, 'large') || fotoUrl(r.taxon, 'medium') || '';
        // Vista inmediata mientras carga el detalle
        $('ficha').innerHTML =
            '<div class="ficha-hero" style="background-image:url(\'' + fotoBig + '\')"></div>' +
            '<div class="ficha-cuerpo"><div class="ficha-titulo"><h3>' + escape(nombre(r.taxon)) +
            '</h3></div><p class="ficha-cargando">Cargando ficha…</p></div>';

        var id = r.taxon.id;
        if (fichaCache[id]) { renderFicha(r, fichaCache[id]); return; }
        fetch('https://api.inaturalist.org/v1/taxa/' + id + '?locale=es')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var t = (data.results || [])[0];
                if (!t) throw new Error('sin ficha');
                fichaCache[id] = t;
                if (!$('modal').hidden) renderFicha(r, t);
            })
            .catch(function () {
                var c = $('ficha').querySelector('.ficha-cargando');
                if (c) c.textContent = 'No se pudo cargar la ficha completa.';
            });
    }

    function cerrarModal() { $('modal').hidden = true; }

    function cargar(taxon) {
        if (cache[taxon]) { render(cache[taxon]); return; }
        setStatus('Cargando especies…');
        $('galeria').innerHTML = '';
        fetch(urlConsulta(taxon))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var res = agruparPorEspecie(data.results || []);
                cache[taxon] = res;
                render(res);
            })
            .catch(function (e) {
                console.error('[Laguna] iNaturalist:', e);
                setStatus('No se pudo cargar la biodiversidad. Intenta más tarde.');
            });
    }

    function onFiltro(e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('chip--on'); });
        btn.classList.add('chip--on');
        taxonActivo = btn.getAttribute('data-taxon') || '';
        cargar(taxonActivo);
    }

    function onGridClick(e) {
        var card = e.target.closest('.bio-card');
        if (!card) return;
        var data = $('galeria')._data || [];
        var r = data[Number(card.getAttribute('data-i'))];
        if (r) abrirFicha(r);
    }

    function onFichaClick(e) {
        var thumb = e.target.closest('.ficha-thumb');
        if (!thumb) return;
        var hero = document.getElementById('ficha-hero');
        if (hero) hero.style.backgroundImage = "url('" + (thumb.getAttribute('data-big') || thumb.src) + "')";
    }

    document.addEventListener('DOMContentLoaded', function () {
        $('filtros').addEventListener('click', onFiltro);
        $('galeria').addEventListener('click', onGridClick);
        $('ficha').addEventListener('click', onFichaClick);
        document.querySelectorAll('[data-close]').forEach(function (el) {
            el.addEventListener('click', cerrarModal);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') cerrarModal();
        });
        cargar('');
    });
})();

/* ==========================================================================
   ESTACIÓN ISLA TEJA · panel de condiciones actuales
   Llama al backend (Render), que es quien consulta la DMC y calcula la ET.
   Rellena el panel si existe (#estacion-card) en la página.
   ========================================================================== */
(function () {
    function $(id) { return document.getElementById(id); }

    function fmt(v, dec) {
        if (v == null || v === '') return '—';
        return Number(v).toLocaleString('es-CL', { maximumFractionDigits: dec == null ? 1 : dec });
    }

    function cargar() {
        var card = $('estacion-card');
        if (!card || typeof API_URL === 'undefined') return;
        fetch(API_URL.replace(/\/$/, '') + '/api/estacion/actual')
            .then(function (r) { return r.json(); })
            .then(function (d) {
                if (!d || !d.ok) { card.style.display = 'none'; return; }
                if ($('est-momento')) $('est-momento').textContent = d.momento_local || '';
                if ($('est-temp'))    $('est-temp').textContent   = fmt(d.temperatura_c) + ' °C';
                if ($('est-hr'))      $('est-hr').textContent     = fmt(d.humedad_relativa_pct) + ' %';
                if ($('est-rad'))     $('est-rad').textContent    = fmt(d.radiacion_global_w_m2) + ' W/m²';
                if ($('est-pp'))      $('est-pp').textContent     = fmt(d.precipitacion_24h_mm) + ' mm';
                if ($('est-viento'))  $('est-viento').textContent = fmt(d.viento_kt) + ' kt';
                if ($('est-et'))      $('est-et').textContent     = fmt(d.et_priestley_mm_h, 3) + ' mm/h';
            })
            .catch(function () { card.style.display = 'none'; });
    }

    document.addEventListener('DOMContentLoaded', cargar);
})();

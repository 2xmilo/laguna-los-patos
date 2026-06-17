/* ==========================================================================
   DASHBOARD · lee lecturas + meteo desde Supabase (SELECT público, anon)
   ========================================================================== */
(function () {
    function $(id) { return document.getElementById(id); }

    function fmt(v, dec) {
        if (v == null || v === '') return '—';
        return Number(v).toLocaleString('es-CL', { maximumFractionDigits: dec == null ? 1 : dec });
    }

    function fmtFecha(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('es-CL', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return iso; }
    }

    function render(lecturas) {
        // lecturas vienen desc (más reciente primero)
        $('stat-total').textContent = lecturas.length;
        if (lecturas.length) {
            var ult = lecturas[0];
            $('stat-ultimo').textContent = fmt(ult.nivel_cm);
            var meteo = (ult.datos_meteorologicos || [])[0];
            $('stat-et').textContent = meteo ? fmt(meteo.et_priestley_mm_h, 3) : '—';
        }

        // Gráfico (orden ascendente para la serie temporal)
        var serie = lecturas.slice().reverse();
        if (!serie.length) {
            $('chart-empty').hidden = false;
            return;
        }
        var labels = serie.map(function (l) { return fmtFecha(l.creado_en); });
        var data = serie.map(function (l) { return l.nivel_cm; });

        new Chart($('chart-nivel'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nivel (cm)',
                    data: data,
                    borderColor: '#2e7d52',
                    backgroundColor: 'rgba(46,125,82,.12)',
                    fill: true,
                    tension: .25,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { title: { display: true, text: 'cm' } } }
            }
        });

        // Tabla
        var body = $('tabla-body');
        body.innerHTML = lecturas.map(function (l) {
            var m = (l.datos_meteorologicos || [])[0] || {};
            return '<tr>' +
                '<td>' + fmtFecha(l.creado_en) + '</td>' +
                '<td>' + fmt(l.nivel_cm) + '</td>' +
                '<td>' + fmt(m.temperatura_c) + '</td>' +
                '<td>' + fmt(m.precipitacion_24h_mm) + '</td>' +
                '<td>' + fmt(m.et_priestley_mm_h, 3) + '</td>' +
            '</tr>';
        }).join('');
    }

    function cargar() {
        if (!_sb) {
            $('chart-empty').hidden = false;
            $('chart-empty').textContent = 'Supabase no configurado.';
            return;
        }
        _sb.from('lecturas_nivel')
            .select('id,creado_en,nivel_cm,foto_url,datos_meteorologicos(temperatura_c,precipitacion_24h_mm,et_priestley_mm_h)')
            .order('creado_en', { ascending: false })
            .limit(100)
            .then(function (res) {
                if (res.error) {
                    console.error('[Laguna] dashboard:', res.error.message);
                    $('chart-empty').hidden = false;
                    $('chart-empty').textContent = 'No se pudieron cargar las lecturas.';
                    return;
                }
                render(res.data || []);
            });
    }

    document.addEventListener('DOMContentLoaded', cargar);
})();

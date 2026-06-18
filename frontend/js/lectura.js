/* ==========================================================================
   LECTURA · captura del nivel ciudadano
   1) (opcional) sube la foto a Supabase Storage
   2) POST al backend, que cruza con Isla Teja, calcula ET y guarda en Supabase
   ========================================================================== */
(function () {
    function $(id) { return document.getElementById(id); }

    // id anónimo persistente por dispositivo (sin datos personales)
    function getAnonId() {
        var k = 'laguna_anon_id';
        var v = localStorage.getItem(k);
        if (!v) {
            v = 'anon_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem(k, v);
        }
        return v;
    }

    function setStatus(msg, type) {
        var el = $('status');
        if (!el) return;
        el.hidden = false;
        el.textContent = msg;
        el.className = 'status' + (type ? ' status--' + type : '');
    }

    function setLoading(on) {
        var btn = $('btn-enviar');
        if (!btn) return;
        btn.disabled = on;
        btn.textContent = on ? 'Enviando…' : 'Enviar medición';
    }

    // Sube la foto al bucket; devuelve URL pública o null
    function subirFoto(file) {
        if (!file || !_sb) return Promise.resolve(null);
        var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        var path = getAnonId() + '/' + Date.now() + '.' + ext;
        return _sb.storage.from(FOTOS_BUCKET).upload(path, file, {
            cacheControl: '3600',
            upsert: false
        }).then(function (res) {
            if (res.error) {
                console.warn('[Laguna] Foto no subida:', res.error.message);
                return null;
            }
            var pub = _sb.storage.from(FOTOS_BUCKET).getPublicUrl(path);
            return (pub.data && pub.data.publicUrl) || null;
        }).catch(function (e) {
            console.warn('[Laguna] Error subiendo foto:', e);
            return null;
        });
    }

    // Guarda la lectura DIRECTO en Supabase (instantáneo, no depende de Render)
    function guardarLectura(nivel, fotoUrl) {
        if (!_sb) return Promise.reject(new Error('No hay conexión con la base de datos.'));
        return _sb.from('lecturas_nivel')
            .insert({ nivel_cm: nivel, foto_url: fotoUrl, id_anonimo: getAnonId() })
            .select('id')
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return res.data && res.data[0] && res.data[0].id;
            });
    }

    // Cruce con Isla Teja + ET: lo hace el backend EN SEGUNDO PLANO (no esperamos).
    function enriquecer(id) {
        if (!id) return;
        try {
            fetch(API_URL.replace(/\/$/, '') + '/api/enriquecer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lectura_id: id }),
                keepalive: true   // sigue aunque la persona cierre la página
            }).catch(function () {});
        } catch (e) {}
    }

    function mostrarExito() {
        $('form-card').hidden = true;
        $('success-card').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function onSubmit(e) {
        e.preventDefault();
        var nivelRaw = $('nivel_cm').value;
        var nivel = parseFloat(nivelRaw);

        if (isNaN(nivel)) {
            setStatus('Ingresa un número válido para el nivel.', 'error');
            return;
        }
        if (nivel < 0 || nivel > 500) {
            setStatus('El nivel debe estar entre 0 y 500 cm.', 'error');
            return;
        }

        var file = ($('foto').files || [])[0] || null;

        setLoading(true);
        setStatus('Procesando tu medición…', 'loading');

        subirFoto(file)
            .then(function (fotoUrl) {
                return guardarLectura(nivel, fotoUrl);
            })
            .then(function (id) {
                mostrarExito();      // ¡instantáneo! ya quedó guardado
                enriquecer(id);      // el meteo se completa en segundo plano
            })
            .catch(function (err) {
                console.error('[Laguna]', err);
                setStatus(err.message || 'No se pudo registrar la medición. Intenta de nuevo.', 'error');
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /* ── Foto: botón cámara + vista previa ── */
    var _previewUrl = null;

    function limpiarPreview() {
        if (_previewUrl) { URL.revokeObjectURL(_previewUrl); _previewUrl = null; }
        var btn = $('btn-foto');
        if (btn) { btn.classList.remove('tiene-foto'); btn.innerHTML = '<span class="foto-cam">📷</span>'; }
        var pv = $('foto-preview');
        if (pv) pv.innerHTML = '<span class="foto-hint">Toca para tomar o subir una foto de la regla</span>';
    }

    function onFotoChange() {
        var file = ($('foto').files || [])[0];
        if (!file) { limpiarPreview(); return; }
        if (_previewUrl) URL.revokeObjectURL(_previewUrl);
        _previewUrl = URL.createObjectURL(file);
        var btn = $('btn-foto');
        btn.classList.add('tiene-foto');
        btn.innerHTML = '<img src="' + _previewUrl + '" alt="foto">';
        $('foto-preview').innerHTML =
            '<span class="foto-nombre">Foto lista ✓</span>' +
            '<button type="button" class="foto-quitar" id="foto-quitar">Quitar foto</button>';
    }

    function quitarFoto() {
        $('foto').value = '';
        limpiarPreview();
    }

    /* ── Popup de ayuda ── */
    function abrirAyuda() { var p = $('popup-ayuda'); if (p) p.hidden = false; }
    function cerrarAyuda() { var p = $('popup-ayuda'); if (p) p.hidden = true; }

    function onOtra() {
        $('form-lectura').reset();
        limpiarPreview();
        $('status').hidden = true;
        $('success-card').hidden = true;
        $('form-card').hidden = false;
    }

    document.addEventListener('DOMContentLoaded', function () {
        var form = $('form-lectura');
        if (form) form.addEventListener('submit', onSubmit);
        var otra = $('btn-otra');
        if (otra) otra.addEventListener('click', onOtra);

        // Foto estilo celular
        var btnFoto = $('btn-foto');
        if (btnFoto) btnFoto.addEventListener('click', function () { $('foto').click(); });
        var inputFoto = $('foto');
        if (inputFoto) inputFoto.addEventListener('change', onFotoChange);
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'foto-quitar') quitarFoto();
        });

        // Popup de ayuda
        var btnAyuda = $('btn-ayuda');
        if (btnAyuda) btnAyuda.addEventListener('click', abrirAyuda);
        document.querySelectorAll('[data-cerrar-ayuda]').forEach(function (el) {
            el.addEventListener('click', cerrarAyuda);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') cerrarAyuda();
        });
    });
})();

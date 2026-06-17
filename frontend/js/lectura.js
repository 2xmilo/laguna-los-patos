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

    function enviarLectura(nivel, fotoUrl) {
        return fetch(API_URL.replace(/\/$/, '') + '/api/lectura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nivel_cm: nivel,
                foto_url: fotoUrl,
                id_anonimo: getAnonId()
            })
        }).then(function (r) {
            return r.json().then(function (data) {
                if (!r.ok) throw new Error(data.error || 'Error al registrar');
                return data;
            });
        });
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
                return enviarLectura(nivel, fotoUrl);
            })
            .then(function () {
                mostrarExito();
            })
            .catch(function (err) {
                console.error('[Laguna]', err);
                setStatus(err.message || 'No se pudo registrar la medición. Intenta de nuevo.', 'error');
            })
            .finally(function () {
                setLoading(false);
            });
    }

    function onOtra() {
        $('form-lectura').reset();
        $('status').hidden = true;
        $('success-card').hidden = true;
        $('form-card').hidden = false;
    }

    document.addEventListener('DOMContentLoaded', function () {
        var form = $('form-lectura');
        if (form) form.addEventListener('submit', onSubmit);
        var otra = $('btn-otra');
        if (otra) otra.addEventListener('click', onOtra);
    });
})();

/* ==========================================================================
   SUPABASE CLIENT · Laguna Los Patos
   (mismo patrón que Evergreen: cliente único por CDN)
   ========================================================================== */

var _sb = (function () {
    if (typeof supabase === 'undefined') {
        console.error('[Laguna] Supabase JS no cargado. Verifica el CDN.');
        return null;
    }
    try {
        return supabase.createClient(SUPA_URL, SUPA_ANON_KEY);
    } catch (e) {
        console.error('[Laguna] Error inicializando Supabase:', e);
        return null;
    }
})();

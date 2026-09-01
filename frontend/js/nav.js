/* ==========================================================================
   NAV · Barra de pestañas inferior (app shell)
   5 pestañas: Mapa · Explorar · Guías · Logros · Perfil. Íconos de línea (SVG).
   La pestaña activa se marca con <body data-tab="...">. Se aceptan alias de
   los nombres viejos (humedal→explorar, cupones→logros) para no tocar cada página.
   ========================================================================== */
(function () {
  var raw = document.body.dataset.tab || '';
  var alias = { humedal: 'explorar', cupones: 'logros', guias: 'descubre',
                avistar: 'descubre', observar: 'descubre', reportar: 'descubre', docente: 'descubre' };
  var actual = alias[raw] || raw;
  var ultimo = localStorage.getItem('ph_ultimo_humedal') || 'laguna-los-patos';

  var ICO = {
    mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    explorar: '<circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M6 11V6l3-2M18 11V6l-3-2M10 15h4"/>',
    descubre: '<path d="M7 20h10M12 20v-9"/><path d="M12 11C12 6.6 9 4 4.5 4 4.5 8.4 7.5 11 12 11z"/><path d="M12 12.5c0-3.3 2.4-5.5 6-5.5 0 3.3-2.7 5.5-6 5.5z"/>',
    logros: '<path d="M6 4h12v3a6 6 0 0 1-12 0V4z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M9 20h6M12 13v4"/>',
    perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  var TABS = [
    { id: 'mapa', href: 'index.html', txt: 'Mapa' },
    { id: 'explorar', href: 'explorar.html', txt: 'Explorar' },
    { id: 'descubre', href: 'descubre.html', txt: 'Descubre' },
    { id: 'logros', href: 'cupones.html?id=' + ultimo, txt: 'Logros' },
    { id: 'perfil', href: 'cuenta.html?id=' + ultimo, txt: 'Perfil' }
  ];

  var nav = document.createElement('nav');
  nav.className = 'ph-tabs';
  nav.innerHTML = TABS.map(function (t) {
    return '<a class="ph-tab' + (t.id === actual ? ' act' : '') + '" href="' + t.href + '">' +
      '<span class="t-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + ICO[t.id] + '</svg></span>' +
      '<span class="t-txt">' + t.txt + '</span></a>';
  }).join('');
  document.body.appendChild(nav);
  document.body.classList.add('con-tabs');
})();

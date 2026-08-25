/* ==========================================================================
   NAV · Barra de pestañas inferior (app shell)
   Se inyecta en todas las páginas. La pestaña activa se marca con
   <body data-tab="mapa|humedal|cupones|perfil">.
   El último humedal visitado se recuerda para la pestaña Humedal.
   ========================================================================== */
(function () {
  var actual = document.body.dataset.tab || '';
  var ultimo = localStorage.getItem('ph_ultimo_humedal') || 'laguna-los-patos';

  var TABS = [
    { id: 'mapa', href: 'index.html', ico: '🗺️', txt: 'Mapa' },
    { id: 'humedal', href: 'humedal.html?id=' + ultimo, ico: '🌿', txt: 'Humedal' },
    { id: 'cupones', href: 'cupones.html?id=' + ultimo, ico: '🎟️', txt: 'Cupones' },
    { id: 'perfil', href: 'cuenta.html?id=' + ultimo, ico: '🦆', txt: 'Perfil' }
  ];

  var nav = document.createElement('nav');
  nav.className = 'ph-tabs';
  nav.innerHTML = TABS.map(function (t) {
    return '<a class="ph-tab' + (t.id === actual ? ' act' : '') + '" href="' + t.href + '">' +
           '<span class="t-ico">' + t.ico + '</span><span class="t-txt">' + t.txt + '</span></a>';
  }).join('');
  document.body.appendChild(nav);
  document.body.classList.add('con-tabs');
})();

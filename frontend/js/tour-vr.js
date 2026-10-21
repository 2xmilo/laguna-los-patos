/* ==========================================================================
   MODO VR (visor tipo Cardboard) del tour 360°
   --------------------------------------------------------------------------
   Pannellum no dibuja en pantalla dividida, así que el modo VR es un visor
   aparte, encima del tour, con Three.js (se descarga recién al entrar).

   - Mismo pano para los dos ojos: las fotos del dron son de una sola cámara,
     así que no hay profundidad que separar. Se ve inmersivo, pero plano.
   - Se mira girando la cabeza (deviceorientation). Sin giroscopio —un
     computador— se arrastra con el mouse, lo que sirve para probarlo.
   - Se viaja MIRANDO: las flechas son las mismas de la escena de Pannellum
     (`pitch`, `yaw`, `clickHandlerFunc`); dejar la mira encima ~1,6 s, o tocar
     la pantalla (el botón del visor), dispara el mismo viaje que el toque.
   - Pannellum sigue siendo la fuente de verdad: el viaje se hace en él y al
     terminar de cargar (`load`) el VR toma su escena y su rumbo de llegada.
     Al salir, Pannellum queda mirando hacia donde mirabas en el visor.
   ========================================================================== */
var phVR = (function () {
  var THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';
  var MIRADA_MS = 1600;      // cuánto hay que sostener la mira sobre una flecha
  var MIRADA_GRADOS = 8;     // radio de acierto de la mira
  var D2R = Math.PI / 180;

  var T = null;              // el módulo de Three, una vez cargado
  var c = null;              // contexto que pasa tour.html
  var ui = null, renderer, escena, cam, mat, textura = null, marcas = [];
  var abierto = false, cargando = false, raf = 0, token = 0;

  // Orientación: la del celular (giro) o la manual (arrastre).
  var giro = null, offset = 0, alinear = true, manual = { yaw: 0, pitch: 0 };
  var mirando = null, desde = 0;

  /* ---------------------------------------------------------------- UI --- */
  function armarUI() {
    var d = document.createElement('div');
    d.className = 'vr';
    var ojo = function (lado) {
      return '<div class="vr-ojo vr-ojo--' + lado + '">' +
        '<svg class="vr-mira" viewBox="0 0 40 40" aria-hidden="true">' +
          '<circle cx="20" cy="20" r="3" class="vr-mira__punto"/>' +
          '<circle cx="20" cy="20" r="13" class="vr-mira__aro" pathLength="100"/>' +
        '</svg><span class="vr-etq"></span></div>';
    };
    d.innerHTML = '<canvas></canvas>' + ojo('izq') + ojo('der') + '<div class="vr-sep"></div>' +
      '<button class="vr-salir" type="button">Salir del modo VR</button>' +
      '<div class="vr-girar"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="16" y="6" width="16" height="30" rx="3"/>' +
        '<path d="M8 30a16 16 0 0 0 14 12M40 18A16 16 0 0 0 26 6M22 42l-4-1 2-4M26 6l4 1-2 4"/></svg>' +
        '<p>Gira el celular en horizontal y ponlo en el visor</p></div>' +
      '<div class="vr-cargando">Cargando…</div>';
    document.body.appendChild(d);
    d.querySelector('.vr-salir').addEventListener('click', function (e) { e.stopPropagation(); cerrar(); });
    return {
      raiz: d,
      canvas: d.querySelector('canvas'),
      aros: d.querySelectorAll('.vr-mira__aro'),
      etqs: d.querySelectorAll('.vr-etq')
    };
  }

  function pintarMira(progreso, texto) {
    var off = (100 - progreso * 100).toFixed(1);
    ui.aros.forEach(function (a) { a.style.strokeDashoffset = off; });
    ui.etqs.forEach(function (e) { e.textContent = texto || ''; });
    ui.raiz.classList.toggle('apuntando', !!texto);
  }

  /* --------------------------------------------------------- Pantalla --- */
  function pantallaCompleta() {
    var de = document.documentElement;
    var pedir = de.requestFullscreen || de.webkitRequestFullscreen;
    if (!pedir || document.fullscreenElement) return;
    try {
      var p = pedir.call(de);
      if (p && p.then) p.then(function () {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
      }).catch(function () {});
    } catch (e) {}
  }
  function salirPantallaCompleta() {
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
  }

  // iOS 13+ exige pedir permiso dentro del mismo toque del usuario.
  function pedirPermiso() {
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      return DOE.requestPermission().catch(function () { return 'denied'; });
    }
    return Promise.resolve('granted');
  }

  /* ----------------------------------------------------- Orientación --- */
  function alGirar(e) {
    if (e.alpha === null) return;
    giro = { a: e.alpha, b: e.beta, g: e.gamma };
  }
  function anguloPantalla() {
    var a = (screen.orientation && typeof screen.orientation.angle === 'number')
      ? screen.orientation.angle : (window.orientation || 0);
    return a * D2R;
  }

  var qDev, qOff, qAux, qX, euler, ejeY, ejeZ, adelante;
  function prepararMatematica() {
    qDev = new T.Quaternion(); qOff = new T.Quaternion(); qAux = new T.Quaternion();
    qX = new T.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));   // cámara mira por -z, no por +y
    euler = new T.Euler(); ejeY = new T.Vector3(0, 1, 0); ejeZ = new T.Vector3(0, 0, 1);
    adelante = new T.Vector3();
  }
  // El mismo cálculo que DeviceOrientationControls de Three.
  function quaternionDelCelular(q) {
    euler.set(giro.b * D2R, giro.a * D2R, -giro.g * D2R, 'YXZ');
    q.setFromEuler(euler);
    q.multiply(qX);
    q.multiply(qAux.setFromAxisAngle(ejeZ, -anguloPantalla()));
    return q;
  }
  // Rumbo "Pannellum" (grados, positivo a la derecha) de un vector de vista.
  function yawDe(v) { return Math.atan2(v.x, -v.z) / D2R; }
  function pitchDe(v) { return Math.asin(Math.max(-1, Math.min(1, v.y))) / D2R; }
  function direccion(yaw, pitch, v) {
    var y = yaw * D2R, p = pitch * D2R;
    return v.set(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
  }

  function orientarCamara() {
    if (giro) {
      quaternionDelCelular(qDev);
      if (alinear) {
        // Girar el mundo para que lo que tengo enfrente sea el rumbo con el que
        // Pannellum llegó a esta estación (el de la flecha que tomaste).
        adelante.set(0, 0, -1).applyQuaternion(qDev);
        offset = (yawDe(adelante) - c.viewer.getYaw()) * D2R;
        alinear = false;
      }
      cam.quaternion.copy(qOff.setFromAxisAngle(ejeY, offset)).multiply(qDev);
    } else {
      euler.set(manual.pitch * D2R, -manual.yaw * D2R, 0, 'YXZ');
      cam.quaternion.setFromEuler(euler);
    }
  }

  // Arrastre (computador o celular sin giroscopio).
  var arrastre = null;
  function alBajar(e) { arrastre = { x: e.clientX, y: e.clientY, mov: false }; }
  function alMover(e) {
    if (!arrastre || giro) return;
    var dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) arrastre.mov = true;
    manual.yaw -= dx * 0.25; manual.pitch = Math.max(-85, Math.min(85, manual.pitch + dy * 0.25));
    arrastre.x = e.clientX; arrastre.y = e.clientY;
  }
  // Un toque sin arrastre = el botón del visor: viaja a la flecha que miras.
  function alSubir() {
    var fue = arrastre && !arrastre.mov;
    arrastre = null;
    if (fue && mirando && !cargando) viajar(mirando);
  }
  function alTecla(e) { if (e.key === 'Escape') cerrar(); }

  /* -------------------------------------------------------- Escena 3D --- */
  var VERT = 'varying vec3 vDir; void main(){ vDir = position; ' +
             'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  // Equirectangular por dirección: el centro de la foto es yaw 0, como en Pannellum.
  var FRAG = 'uniform sampler2D pano; varying vec3 vDir; const float PI = 3.14159265; ' +
             'void main(){ vec3 d = normalize(vDir); ' +
             'float u = 0.5 + atan(d.x, -d.z) / (2.0 * PI); ' +
             'float v = 0.5 + asin(clamp(d.y, -1.0, 1.0)) / PI; ' +
             'gl_FragColor = texture2D(pano, vec2(u, v)); }';

  function armarEscena() {
    renderer = new T.WebGLRenderer({ canvas: ui.canvas, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    escena = new T.Scene();
    cam = new T.PerspectiveCamera(85, 1, 0.1, 100);
    mat = new T.ShaderMaterial({
      uniforms: { pano: { value: null } }, vertexShader: VERT, fragmentShader: FRAG,
      side: T.BackSide, depthWrite: false
    });
    escena.add(new T.Mesh(new T.SphereGeometry(50, 48, 24), mat));
  }

  // Íconos de las flechas, en canvas: los mismos dos de tour.html (disco
  // elíptico con chevron = estación; anillo dorado = cruce a otro humedal).
  function iconoCanvas(cruce, etiqueta) {
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 256;
    var x = cv.getContext('2d');
    if (cruce) {
      x.strokeStyle = '#C98A2D';
      x.globalAlpha = .75; x.lineWidth = 7; x.beginPath(); x.arc(128, 150, 64, 0, 2 * Math.PI); x.stroke();
      x.globalAlpha = 1; x.fillStyle = 'rgba(201,138,45,.3)'; x.lineWidth = 8;
      x.beginPath(); x.arc(128, 150, 40, 0, 2 * Math.PI); x.fill(); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(128, 150, 13, 0, 2 * Math.PI); x.fill();
      if (etiqueta) {
        x.font = '700 22px Nunito, system-ui, sans-serif';
        var w = Math.min(248, x.measureText(etiqueta).width + 24);
        x.fillStyle = 'rgba(0,0,0,.7)';
        x.beginPath(); x.roundRect ? x.roundRect(128 - w / 2, 34, w, 36, 12) : x.rect(128 - w / 2, 34, w, 36); x.fill();
        x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(etiqueta, 128, 53, 236);
      }
    } else {
      x.fillStyle = 'rgba(255,255,255,.92)';
      x.beginPath(); x.ellipse(128, 136, 86, 36, 0, 0, 2 * Math.PI); x.fill();
      x.strokeStyle = 'rgba(10,44,40,.32)'; x.lineWidth = 4; x.stroke();
      x.strokeStyle = '#0A2C28'; x.lineWidth = 12; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(96, 149); x.lineTo(128, 120); x.lineTo(160, 149); x.stroke();
    }
    var t = new T.CanvasTexture(cv);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }

  function armarMarcas(slug) {
    marcas.forEach(function (m) { escena.remove(m.sprite); m.sprite.material.map.dispose(); m.sprite.material.dispose(); });
    marcas = [];
    (c.escenas[slug].hotSpots || []).forEach(function (hs) {
      var a = hs.createTooltipArgs || {};
      var s = new T.Sprite(new T.SpriteMaterial({ map: iconoCanvas(a.cruce, a.etiqueta), depthTest: false, transparent: true }));
      var dir = direccion(hs.yaw, hs.pitch, new T.Vector3());
      s.position.copy(dir).multiplyScalar(10);
      var k = 2.1 * (parseFloat(a.esc) || 1);
      s.scale.set(k, k, 1);
      escena.add(s);
      marcas.push({ hs: hs, dir: dir, sprite: s, nombre: a.aria || '' });
    });
  }

  // Un pano de 6000 px puede pasar el máximo de textura de algunos celulares.
  function cargarPano(slug) {
    var mio = ++token;
    cargando = true;
    ui.raiz.classList.add('cargando');
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      if (mio !== token || !abierto) return;
      var max = renderer.capabilities.maxTextureSize, fuente = img;
      if (img.width > max) {
        fuente = document.createElement('canvas');
        fuente.width = max; fuente.height = Math.round(max * img.height / img.width);
        fuente.getContext('2d').drawImage(img, 0, 0, fuente.width, fuente.height);
      }
      var t = new T.Texture(fuente);
      t.generateMipmaps = false; t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter;
      t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
      t.needsUpdate = true;
      if (textura) textura.dispose();
      textura = t; mat.uniforms.pano.value = t;
      armarMarcas(slug);
      cargando = false;
      ui.raiz.classList.remove('cargando');
    };
    img.onerror = function () { cargando = false; ui.raiz.classList.remove('cargando'); };
    img.src = c.escenas[slug].panorama;
  }

  // El viaje lo hace Pannellum (mismo handler que el toque); al terminar de
  // cargar, `alCargar` trae la nueva escena al visor.
  function viajar(m) {
    cargando = true;
    mirando = null; pintarMira(0, '');
    ui.raiz.classList.add('cargando');
    m.hs.clickHandlerFunc();
  }
  function alCargar() {
    if (!abierto) return;
    alinear = true;
    manual.yaw = c.viewer.getYaw();
    cargarPano(c.viewer.getScene());
  }

  /* ------------------------------------------------------------- Loop --- */
  function cuadro(ahora) {
    raf = requestAnimationFrame(cuadro);
    var w = ui.canvas.clientWidth, h = ui.canvas.clientHeight;
    if (!w || !h) return;
    var px = renderer.getPixelRatio();
    if (ui.canvas.width !== Math.round(w * px) || ui.canvas.height !== Math.round(h * px)) renderer.setSize(w, h, false);

    orientarCamara();
    cam.aspect = (w / 2) / h;
    cam.updateProjectionMatrix();

    // ¿Qué flecha está bajo la mira?
    adelante.set(0, 0, -1).applyQuaternion(cam.quaternion);
    var mejor = null, mejorAng = MIRADA_GRADOS;
    if (!cargando) marcas.forEach(function (m) {
      var ang = Math.acos(Math.max(-1, Math.min(1, adelante.dot(m.dir)))) / D2R;
      if (ang < mejorAng) { mejorAng = ang; mejor = m; }
    });
    if (mejor !== mirando) { mirando = mejor; desde = ahora; }
    if (mirando) {
      var p = Math.min(1, (ahora - desde) / MIRADA_MS);
      pintarMira(p, mirando.nombre);
      if (p >= 1) viajar(mirando);
    } else pintarMira(0, '');

    renderer.setScissorTest(true);
    [0, w / 2].forEach(function (x) {
      renderer.setViewport(x, 0, w / 2, h);
      renderer.setScissor(x, 0, w / 2, h);
      renderer.render(escena, cam);
    });
  }

  /* ------------------------------------------------------ Abrir/cerrar --- */
  function abrir(ctx) {
    if (abierto) return;
    // Permiso y pantalla completa tienen que pedirse ya, dentro del toque.
    var permiso = pedirPermiso();
    pantallaCompleta();

    c = ctx; abierto = true; giro = null; alinear = true;
    manual.yaw = c.viewer.getYaw(); manual.pitch = c.viewer.getPitch();
    ui = armarUI();
    ui.raiz.classList.add('cargando');

    Promise.all([permiso, T ? Promise.resolve(T) : import(THREE_URL)]).then(function (r) {
      if (!abierto) return;
      T = r[1];
      if (r[0] === 'granted') window.addEventListener('deviceorientation', alGirar);
      prepararMatematica();
      armarEscena();
      ui.canvas.addEventListener('pointerdown', alBajar);
      window.addEventListener('pointermove', alMover);
      window.addEventListener('pointerup', alSubir);
      document.addEventListener('keydown', alTecla);
      c.viewer.on('load', alCargar);
      cargarPano(c.actual());
      raf = requestAnimationFrame(cuadro);
    }).catch(function () {
      cerrar();
      alert('No se pudo abrir el modo VR en este dispositivo.');
    });
  }

  function cerrar() {
    if (!abierto) return;
    abierto = false; token++;
    cancelAnimationFrame(raf);
    window.removeEventListener('deviceorientation', alGirar);
    window.removeEventListener('pointermove', alMover);
    window.removeEventListener('pointerup', alSubir);
    document.removeEventListener('keydown', alTecla);
    if (c && c.viewer.off) c.viewer.off('load', alCargar);

    // Pannellum queda mirando hacia donde mirabas en el visor.
    if (cam && c) {
      adelante.set(0, 0, -1).applyQuaternion(cam.quaternion);
      c.viewer.setPitch(pitchDe(adelante), false);
      c.viewer.setYaw(yawDe(adelante), false);
    }
    marcas.forEach(function (m) { m.sprite.material.map.dispose(); m.sprite.material.dispose(); });
    marcas = [];
    if (textura) { textura.dispose(); textura = null; }
    if (renderer) { renderer.dispose(); renderer = null; }
    cam = null;
    if (ui) { ui.raiz.remove(); ui = null; }
    salirPantallaCompleta();
    if (c && c.alSalir) c.alSalir();
  }

  return { abrir: abrir, cerrar: cerrar };
})();

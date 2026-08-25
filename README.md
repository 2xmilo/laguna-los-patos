# RedHumedal · Red Digital de Humedales de Isla Teja

Plataforma web (sin instalación) que conecta a la comunidad con la **red de
humedales de Isla Teja, Valdivia**. Se accede desde la web o por un QR físico en
cada punto de observación.

> **Idea rectora:** una *red* de humedales donde **cada humedal puede tener sus
> propias herramientas**, que se agregan con el tiempo a medida que crecen la red
> y los usuarios. La primera herramienta es el **monitoreo de nivel** de la
> Laguna de los Patos.

Nombre visible del sitio: *Humedales de Valdivia · Red de Isla Teja*.
`RedHumedal` es el nombre interno del proyecto/repositorio.

## Arquitectura de carpetas

```
RedHumedal/
├─ frontend/                       # ← estático → Vercel (raíz del deploy)
│  ├─ index.html                   # mapa de la red (Leaflet + OSM)
│  ├─ humedal.html                 # hub de CUALQUIER humedal (?id=…)
│  ├─ tour.html                    # tour 360° (Pannellum)
│  ├─ avistar.html                 # avistamiento con IA (iNaturalist)
│  ├─ reportar.html                # denuncia anónima
│  ├─ observar.html                # reconocer especies
│  ├─ cupones.html · cuenta.html · docente.html · panel.html
│  ├─ css/  js/  data/  panos/
│  └─ herramientas/                # 🔑 herramientas POR humedal (extensible)
│     └─ laguna-los-patos/
│        └─ monitoreo-nivel/       # monitoreo ciudadano de nivel + dashboard
│
├─ backend/                        # servicio de la plataforma (Flask → Render)
│                                  #   /api/avistamiento · /api/denuncia
├─ backend-laguna-nivel/           # servicio del monitoreo (Flask → Render)
│                                  #   /api/lectura · cruce DMC · ET
├─ supabase/
│  ├─ schema-plataforma.sql        # tablas ph_avistamientos, ph_denuncias
│  └─ schema-laguna-nivel.sql      # tablas lecturas_nivel, datos_meteorologicos
└─ docs/                           # KMZ y fotos-fuente (no se publican)
```

### Cómo agregar una herramienta nueva a un humedal

Creá `frontend/herramientas/<humedal-id>/<herramienta>/` con su propio
`index.html` (y su css/js). Enlazala desde `humedal.html` para ese `<humedal-id>`.
No hace falta tocar el resto de la app. Ese es el patrón para crecer.

## Dónde se edita cada cosa

| Querés cambiar… | Editá… |
|---|---|
| El mapa / listado de humedales | `frontend/data/humedales.json` + `frontend/index.html` |
| Las historias del avatar-guía | `frontend/js/avatar.js` |
| Puntos, cupones, insignias | `frontend/js/puntos.js` |
| El hub de un humedal | `frontend/humedal.html` |
| El tour 360° / estaciones | `frontend/tour.html` + `frontend/panos/` |
| El monitoreo de nivel de la laguna | `frontend/herramientas/laguna-los-patos/monitoreo-nivel/` |
| Estilos globales de la plataforma | `frontend/css/style.css` |

## Cómo se conecta todo

- **Mismo deploy, una sola URL.** La plataforma es la raíz; el monitoreo de nivel
  vive en `/herramientas/laguna-los-patos/monitoreo-nivel/` y se enlaza desde el
  hub de la laguna (`MONITOREO_LAGUNA_URL` en `frontend/js/config.js`).
- **Mismo Supabase** (`noqcvqatxzpqbtwdnmgk`). Tablas `ph_*` para la plataforma y
  `lecturas_nivel` / `datos_meteorologicos` para el monitoreo (no chocan).
- **Modo demo:** sin backends, los formularios simulan la respuesta
  (`PH_MODO_DEMO_FALLBACK`) para mostrar el flujo completo.

## Despliegue

- **Frontend (Vercel):** ya conectado al repo; *Root Directory* = `frontend/`.
  Cada `push` a `main` redeploya `laguna-los-patos.vercel.app`.
- **Backends (Render):** un Web Service por carpeta (`backend/` y
  `backend-laguna-nivel/`). Build `pip install -r requirements.txt`, start por
  `Procfile`. Variables en cada `.env.example`. La `SUPABASE_SERVICE_KEY`
  (service_role) va **solo** en los backends, nunca en el frontend.

## Estado y pendientes

- ✅ Migración a arquitectura RedHumedal (plataforma + monitoreo anidado).
- ⏳ **Supabase sin tablas:** aplicar `supabase/schema-*.sql` para que se guarden
  avistamientos, denuncias y lecturas de verdad (hoy solo funciona en modo demo).
- ⏳ **Backends sin desplegar** en Render (el código está listo).
- ⏳ **Panoramas 360° son placeholders** — reemplazar por capturas del dron.
- ⏳ Mejoras de contenido y UX (historias del avatar, especies, experiencia).

## Prueba local

```bash
# Frontend (raíz = frontend/)
cd frontend && python -m http.server 5500      # http://localhost:5500

# Backends (opcional; sin ellos corre en modo demo)
cd backend && cp .env.example .env && pip install -r requirements.txt && python app.py
cd backend-laguna-nivel && cp .env.example .env && pip install -r requirements.txt && python app.py
```

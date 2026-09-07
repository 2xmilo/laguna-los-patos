# RedHumedal · Red Digital de Humedales de Isla Teja

Plataforma web mobile-first (sin instalación) que conecta a la comunidad con la
**red de humedales de Isla Teja, Valdivia**. Se accede desde la web o por un QR
físico en cada punto de observación.

> **Idea rectora:** una *red* de humedales donde **cada humedal puede tener sus
> propias herramientas**, que se agregan con el tiempo. La primera herramienta es
> el **monitoreo de nivel** de la Laguna de los Patos. Es una **demo replicable**
> a todos los humedales urbanos de Valdivia.

Nombre visible del sitio: *Humedales de Valdivia · Red de Isla Teja*.
`RedHumedal` es el nombre interno del proyecto/repositorio.

- **Repo / deploy:** `github.com/2xmilo/laguna-los-patos` → Vercel (rama `main`,
  *Root Directory* = `frontend/`). Cada `push` a `main` redeploya.
- **Flujo de trabajo:** el usuario revisa en su **celular** vía la URL de Vercel,
  así que se **commitea + pushea después de cada tanda** de cambios.

## ⚠️ Nota para agentes / sesiones nuevas

- **El proyecto real vive en `…/RedHumedal/`.** La carpeta hermana
  `…/plataforma-humedales/` es un cascarón viejo y vacío (a veces es el `cwd` de
  la sesión). Abrí las sesiones apuntando a `RedHumedal/`.
- **Todo es estático, sin build.** No hay `package.json`. Se sirve con
  `python -m http.server`. No uses bundlers.
- **Anti-caché (importante):** los CSS/JS compartidos se cargan con querystring
  de versión (`suave.css?v=mN`, `nav.js?v=4`, `config.js?v=N`, `avatar.js?v=N`,
  `juego-especies.js?v=N`). **Cada vez que edites uno de esos archivos, subí su
  número `?v=` en todas las páginas que lo referencian**, o el celular servirá la
  versión vieja en caché. (Los `.html` no necesitan versión; se piden frescos.)
- **Verificación:** hay un dev-server + navegador integrados; conviene abrir
  `index.html` y revisar en formato móvil antes de commitear.

## Arquitectura de carpetas

```
RedHumedal/
├─ frontend/                       # ← estático → Vercel (raíz del deploy)
│  ├─ index.html                   # MAPA de la red (Leaflet + OSM) — pestaña Mapa
│  ├─ explorar.html                # lista de humedales → humedal.html — pestaña Explorar
│  ├─ humedal.html                 # hub/detalle de CUALQUIER humedal (?id=…)
│  ├─ descubre.html                # biodiversidad (iNaturalist) + estudios guiados — pestaña Descubre
│  ├─ tour.html                    # tour 360° (Pannellum)
│  ├─ avistar.html                 # avistamiento (perfiles 13+) + mini-juego
│  ├─ observar.html                # reconocer especies (Guardianes) + álbum
│  ├─ reportar.html                # denuncia anónima
│  ├─ cupones.html                 # nivel, insignias, canje — pestaña Logros
│  ├─ cuenta.html                  # perfil, compañero, modos de uso — pestaña Perfil
│  ├─ docente.html · panel.html
│  ├─ css/   (style.css = base;  suave.css = tema "Suave" que lo sobreescribe)
│  ├─ js/    (config, nav, avatar, puntos, biodiversidad, juego-especies, geo)
│  ├─ data/  (humedales.json, humedales.geojson)
│  ├─ panos/ (panorámicas 360° equirectangulares del dron)
│  ├─ img/portadas/ (fotos de portada por humedal)
│  └─ herramientas/                # 🔑 herramientas POR humedal (extensible)
│     └─ laguna-los-patos/monitoreo-nivel/
│
├─ backend/                        # Flask (→ Render): /api/avistamiento, /api/denuncia
├─ backend-laguna-nivel/           # Flask (→ Render): /api/lectura, cruce DMC, ET
├─ supabase/                       # schema-*.sql (tablas aún no aplicadas)
├─ scripts/panos_geo.py            # extrae GPS+rumbo de los panos → humedales.json
└─ docs/                           # KMZ, fotos-fuente, MAPA-DEL-PROYECTO.md (no se publican)
```

### Cómo agregar una herramienta nueva a un humedal
Creá `frontend/herramientas/<humedal-id>/<herramienta>/` con su propio
`index.html`. Enlazala desde `humedal.html`. No hace falta tocar el resto.

## Navegación (rediseño "Suave")

La UI está migrada al diseño **"Suave"** (fuente **Nunito**, paleta verde suave,
tarjetas redondeadas). `css/suave.css` se carga **después** de `style.css` y lo
sobreescribe. En pantallas anchas la app se **contiene en una columna tipo
teléfono** (media query en `suave.css`).

Barra inferior de **5 pestañas** (`js/nav.js`):

| Pestaña | Archivo | Qué es |
|---|---|---|
| Mapa | `index.html` | Mapa Leaflet con pines + hoja inferior con cards |
| Explorar | `explorar.html` | Lista de humedales → detalle (`humedal.html`) |
| Descubre | `descubre.html` | Galería de biodiversidad (iNaturalist) + estudios guiados |
| Logros | `cupones.html` | Nivel, puntos, insignias, canje de cupones |
| Perfil | `cuenta.html` | Compañero, modos de uso, cuenta |

## Dónde se edita cada cosa

| Querés cambiar… | Editá… |
|---|---|
| Humedales, estaciones, coordenadas, especies | `frontend/data/humedales.json` |
| El mapa y sus pines / hoja | `frontend/index.html` |
| Estilos del rediseño (tema, cards, nav, juego) | `frontend/css/suave.css` |
| Estilos base heredados | `frontend/css/style.css` |
| Avatar-guía: personajes, historias, regla de voz | `frontend/js/avatar.js` |
| Puntos, niveles, cupones, insignias | `frontend/js/puntos.js` |
| Biodiversidad (iNaturalist por polígono) | `frontend/js/biodiversidad.js` |
| Mini-juego de reconocimiento | `frontend/js/juego-especies.js` |
| El hub/detalle de un humedal | `frontend/humedal.html` |
| El tour 360° / estaciones | `frontend/tour.html` + `frontend/panos/` |
| Centro/zoom inicial del mapa | `MAPA_CENTRO` / `MAPA_ZOOM` en `frontend/js/config.js` |
| Monitoreo de nivel de la laguna | `frontend/herramientas/laguna-los-patos/monitoreo-nivel/` |

## Datos: `humedales.json`

Dos bloques: `humedales[]` (cada uno con `id, nombre, centro [lat,lon],
descripcion, piloto, monitoreo_nivel, estaciones[], especies[], tags[], foto`) y
`estaciones{}` (cada una con `nombre, tema, accion, accion_texto, pano, centro,
norte, real`).

- **8 humedales.** Con tour 360° hoy: **Laguna de los Patos** (piloto),
  **Santa Inés** y **Santuario de la Naturaleza Río Cruces**. Los demás tienen
  `estaciones: []` (aparecen en mapa/lista pero sin tour aún).
- **`accion`** de una estación: `avistar` → `avistar.html`; `reportar` →
  `reportar.html`; `descubrir` → narración del avatar.

### Panos 360° y `panos_geo.py`
Los panos son **capturas reales del dron** (equirectangulares 2:1, ~6000×3000,
3–5 MB c/u). Su ubicación y orientación **no** se leen del EXIF en runtime: el
script [`scripts/panos_geo.py`](scripts/panos_geo.py) extrae **GPS → `centro`** y
**GimbalYawDegree → `norte`** de cada foto y los escribe en `humedales.json`
(offline; `--write` para aplicar, sin flags es dry-run). `tour.html` usa esos
valores para orientar el panorama y calcular el rumbo/distancia real de las
flechas entre estaciones. Al agregar panos nuevos: ponelos en `panos/`, agrégalos
como estaciones en el JSON y corré el script (o extraé los datos con él).

## Avatar-guía y **regla de biología honesta**

Cuatro personajes reales (Cisne de cuello negro, Monito del monte, Ranita de
Darwin, Garza grande) en `js/avatar.js`. El usuario elige un **compañero**.

- **Regla de voz (escalable):** el avatar habla en **1ª persona solo si su
  especie está en la lista `especies` de ese humedal**; si no, narra como *guía*.
- **Nunca se nombran especies que no están** en el sitio. Los guiones de lugar
  (`PH_LUGARES`) solo mencionan especies reales. Al sumar un humedal, se cargan
  sus `especies` reales y los avatares se adaptan sin reescribir nada.
- El guía se puede **ocultar** (pill "Ocultar guía" arriba a la derecha;
  `localStorage.ph_guia_oculta`).

## Biodiversidad + mini-juego

- `biodiversidad.js` trae especies **reales** observadas dentro del polígono del
  humedal desde la **API pública de iNaturalist** (sin token). Requiere que el
  humedal tenga polígono en `humedales.geojson`.
- `juego-especies.js` es el mini-juego de reconocimiento: los **distractores son
  del mismo reino** que la especie correcta (nunca planta vs animal); solo se
  preguntan especies de reinos con ≥3 miembros. Álbum coleccionable para
  Guardianes.

## Puntos, niveles y modos

Sistema de **puntos/niveles** (no XP), en `js/puntos.js`: niveles Visitante →
Vecino del humedal → Guardián de la ribera → Voz del humedal; cupones reales
(p.ej. Café Panaka). El **modo escuela** desactiva cupones. Perfiles etarios
(Guardián <13 / Explorador 13-17 / Guardabosques 18+) cambian el tono y las
acciones. Todo el estado del usuario vive en **localStorage** (`ph_perfil`,
`ph_companero`, `ph_puntos`, `ph_album`, `ph_modo`, `ph_guia_oculta`, …).

## Cómo se conecta todo

- **Una sola URL.** La plataforma es la raíz; el monitoreo de nivel vive en
  `/herramientas/laguna-los-patos/monitoreo-nivel/` (`MONITOREO_LAGUNA_URL` en
  `config.js`).
- **"¿Cómo llegar?"** en el detalle usa un **embed de Google Maps sin API key**
  (`output=embed`) centrado en cada humedal.
- **Mismo Supabase** (`noqcvqatxzpqbtwdnmgk`): tablas `ph_*` (plataforma) y
  `lecturas_nivel` / `datos_meteorologicos` (monitoreo).
- **Modo demo:** sin backends, los formularios simulan la respuesta
  (`PH_MODO_DEMO_FALLBACK`) para mostrar el flujo completo.

## Estado y pendientes

- ✅ Arquitectura RedHumedal + rediseño Suave (5 pestañas) en toda la app.
- ✅ Panos 360° reales (Laguna, Santa Inés, Río Cruces) mapeados por GPS.
- ✅ Biodiversidad iNaturalist + mini-juego + álbum.
- ✅ 8 humedales (incluye Santuario Río Cruces).
- ⏳ **Portadas** reales solo para Laguna, Santa Inés y Río Cruces; faltan los
  otros 5.
- ⏳ **`especies` de Río Cruces vacío** (definir especies insignia reales).
- ⏳ **"Salida grupal"** (en Descubre) desactivada hasta rediseñar su UX.
- ⏳ **Supabase sin tablas** y **backends sin desplegar** (código listo; hoy corre
  en modo demo).
- ⏳ Pin de Río Cruces queda fuera del encuadre inicial del mapa (está al NO).

## Prueba local

```bash
# Frontend (raíz = frontend/)
cd frontend && python -m http.server 5500      # http://localhost:5500

# Backends (opcional; sin ellos corre en modo demo)
cd backend && cp .env.example .env && pip install -r requirements.txt && python app.py
cd backend-laguna-nivel && cp .env.example .env && pip install -r requirements.txt && python app.py
```

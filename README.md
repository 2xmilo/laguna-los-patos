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
- **`accion` / `accion_texto`** de una estación: hoy los usa **solo
  `docente.html`** (para armar el reto de cada parada). `tour.html` ya no los
  lee: el botón de acción por estación se reemplazó por dos herramientas fijas
  (giro automático on/off y reporte).

### Panos 360° y `panos_geo.py`
Los panos son **capturas reales del dron** (equirectangulares 2:1, ~6000×3000,
3–5 MB c/u). Su ubicación, orientación y altura **no** se leen del EXIF en
runtime: el script [`scripts/panos_geo.py`](scripts/panos_geo.py) extrae
**GPS → `centro`**, **GimbalYawDegree → `norte`** y **RelativeAltitude →
`altitud`** de cada foto y los escribe en `humedales.json` (offline; `--write`
para aplicar, sin flags es dry-run). Al agregar panos nuevos: ponelos en
`panos/`, agrégalos como estaciones en el JSON y corré el script.

**Ojo:** 7 de los 11 panos (`si-totoral2`, `si-salida`, `si-cruce` y los cuatro
`sn-*`) fueron reexportados y perdieron todo el EXIF/XMP. Su `centro`, `norte` y
`altitud` están cargados a mano; el script los saltea y **no** los pisa.

### Geometría de las flechas del tour
`tour.html` no coloca las flechas a ojo: las deriva de esos tres campos.

- **Rumbo (`yaw`)** = rumbo GPS real entre estaciones menos el `norte` del pano.
- **Altura (`pitch`)** = `-atan(altitud / distancia)`. El marcador se apoya en el
  **suelo bajo la estación destino**: como el pano está `altitud` m sobre un
  humedal plano, desde un pano alto la flecha cae en picada (si-mirador → si-borde:
  40 m de alto a 48 m de distancia → −40°) y desde uno bajo queda casi en el
  horizonte (si-borde → si-mirador → −10°). Antes el pitch estaba fijo en −4° y
  por eso todas las flechas se veían a la misma altura sin importar desde dónde
  mirabas.
- **Tamaño** = baja con la distancia (el área táctil no: sigue siendo de 64 px).
- **Iconografía** (SVG en `tour.html`, **sin emojis**): la estación es un *disco
  elíptico* blanco con chevron, que se lee apoyado en el pasto; el cruce a otro
  humedal es un *anillo doble dorado*, de otra familia visual a propósito.
- **Etiqueta** = solo en los marcadores que **cruzan a otro humedal**, con el
  nombre del humedal + distancia: **encima** del marcador, en cuerpo 10 px,
  blanco sobre negro al 70% y sin marco. Dentro de un humedal el marcador va
  limpio. El marcador de cruce además se levanta `ALZA_CRUCE` (5°) sobre el
  suelo calculado, porque no es un punto del terreno sino un destino lejano.

Las 11 estaciones son **escenas de un solo visor Pannellum**, así que el salto es
un fundido (`loadScene`) y no destruir/recrear el visor. Al tocar una flecha
llegás mirando hacia donde venías caminando; al tocar una miniatura se conserva
el rumbo real que estabas mirando, para que el mundo no "gire" al cambiar de
foto.

La **brújula** (arriba a la derecha) es la misma rosa de los vientos del mapa
(`index.html`): se gira `-(yaw + norte)` en cada frame para que la punta roja
quede en el norte verdadero, y al tocarla el visor se reorienta al norte.

Abajo, sobre las miniaturas, hay dos **herramientas** fijas (`.tour-tool`):
giro automático **on/off** (se recuerda en `localStorage.ph_tour_giro`; apagado
el visor nunca gira solo) y **reporte**, que lleva a `reportar.html` del humedal
en el que estás parado.

### Miniaturas · `panos_thumbs.py`
La barra inferior usaba el pano completo (3–5 MB) para cada círculo de 62 px:
entrar a Santa Inés bajaba ~19 MB antes de mostrar nada.
[`scripts/panos_thumbs.py`](scripts/panos_thumbs.py) recorta el cuadrado central
de cada pano —el mismo encuadre que el círculo ya mostraba— a 160 px en
`frontend/panos/thumbs/` (**38,7 MB → 59 KB**, misma apariencia). Si falta una
miniatura, `tour.html` cae al pano original: pesa, pero no se rompe. Además solo
se precargan las 2 estaciones más cercanas, y ninguna si el visitante pidió
ahorro de datos o está en 2G.

## Avatar-guía y **regla de biología honesta**

Cuatro personajes reales (Cisne de cuello negro, Monito del monte, Ranita de
Darwin, Garza grande) en `js/avatar.js`.

**No hay onboarding.** Antes, entrar a un humedal exigía dos pantallas completas
(edad y compañero) antes de ver nada: el que solo quería el tour tenía que
responder una narrativa para llegar a él. Hoy se entra derecho y **el humedal
elige a su anfitrión**: `phFijarAnfitrion(humedal)` toma un personaje que figure
en las `especies` de ese humedal, así que te recibe alguien que de verdad vive
ahí (Santa Inés → Garza Grande). El anfitrión **no se guarda**: es del lugar, no
del usuario, y es estable por humedal porque se deriva del `id`. Si el visitante
fija un **compañero** en Perfil, ese gana siempre; desde ahí también puede volver
al modo automático (`phLimpiarCompanero`).

**El guía no habla solo.** En el hub y en cada estación del tour el habitante
*aparece* pero llega callado (`phPreparar` en vez de `phDecir`): cuenta el lugar
solo si lo tocás. `phDecir` queda para lo que sí debe hablar sin permiso — la
respuesta a una acción del usuario, una insignia ganada. Su globo además tapaba
el botón "Ver tour 360°", que es justo lo que la mayoría viene a tocar.

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
- ✅ Miniaturas del tour servidas desde `panos/thumbs/` (160 px, 59 KB en total
  contra 38,7 MB de panos).
- ⏳ **Hotspots de infografía** en el tour (marcadores que explican un elemento
  del paisaje en vez de llevarte a otra estación). El código es trivial; lo caro
  es que el `yaw`/`pitch` de cada elemento **hay que sacarlo a mano** pano por
  pano, más el contenido. Detalle en [`CLAUDE.md`](CLAUDE.md).

## Prueba local

```bash
# Frontend (raíz = frontend/)
cd frontend && python -m http.server 5500      # http://localhost:5500

# Backends (opcional; sin ellos corre en modo demo)
cd backend && cp .env.example .env && pip install -r requirements.txt && python app.py
cd backend-laguna-nivel && cp .env.example .env && pip install -r requirements.txt && python app.py
```

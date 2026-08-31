# 🗺️ Mapa del proyecto RedHumedal — ¿dónde está cada cosa?

Guía para ubicar y modificar cualquier parte de la plataforma. Todo vive en
`RedHumedal/`. La web es **un solo motor**: no hay un HTML por humedal, hay
páginas que se rellenan según el humedal que se pida por URL (`?id=…`).

---

## 1. Los humedales (todos en un archivo)

- **Datos:** [`frontend/data/humedales.json`](../frontend/data/humedales.json) — la
  lista de humedales y las estaciones del tour. **Fuente única de verdad.**
- **Polígonos del mapa:** [`frontend/data/humedales.geojson`](../frontend/data/humedales.geojson)
- **Mapa de la red (portada):** [`frontend/index.html`](../frontend/index.html)
- **Ficha/hub de cualquiera:** [`frontend/humedal.html`](../frontend/humedal.html)
  → se abre con `humedal.html?id=santa-ines`, etc.

**Agregar un humedal nuevo:** sumar un objeto a `humedales` en `humedales.json`
(id, nombre, `centro` [lat,lon], descripción, `estaciones`) + su polígono en el
geojson. No se toca HTML.

Estado real de las imágenes: **solo Laguna de los Patos y Santa Inés tienen
fotos**. Los demás (La Cancha, Los Pelúes, El Buda, Hualve, La Rotonda) están sin
estaciones (sin tour todavía).

---

## 2. Los panos 360° y su geolocalización 🛸

"Pano" = **panorámica** 360° equirectangular (imagen 2:1) capturada con el dron.

- **Archivos:** [`frontend/panos/`](../frontend/panos) (un `.jpg` por estación)
- **Tour que los muestra:** [`frontend/tour.html`](../frontend/tour.html) (Pannellum)
- **Ubicación y orientación:** NO se leen del EXIF en vivo. Salen de dos campos
  de cada estación en `humedales.json`:
  - `centro`: `[lat, lon]` desde dónde se tomó el pano
  - `norte`: grados para orientar el pano hacia el norte real (= `GimbalYawDegree`
    de la foto DJI)
  - `real`: `true` = captura del dron · `false` = placeholder de muestra

### Herramienta: mapear panos automáticamente
[`scripts/panos_geo.py`](../scripts/panos_geo.py) lee GPS + rumbo de cada JPG y
completa `centro`/`norte` solo:

```bash
python scripts/panos_geo.py            # muestra qué cambiaría (dry-run)
python scripts/panos_geo.py --write    # aplica al JSON
```

Cada vez que agregues panos nuevos del dron, corré esto y quedan ubicados y
orientados sin trabajo manual. (Los placeholders sin metadata se dejan a mano.)

---

## 3. Los habitantes / animales y cómo hablan

Todo en [`frontend/js/avatar.js`](../frontend/js/avatar.js):

- **Los 4 compañeros** (Cisne de Cuello Negro, Monito del Monte, Ranita de
  Darwin, Garza Grande) con su dibujo SVG y lema → objeto `PH_PERSONAJES`.
- **Todos los diálogos**, por edad y por estación → objeto `PH_HISTORIAS`
  (bienvenida, estaciones, avistamiento, reporte).
- **Qué animal narra cada estación** → `PH_PERSONAJE_ESTACION`.

Cada estación tiene 3 versiones de texto según el perfil etario (ver abajo).

---

## 4. Modos de uso — son DOS ejes distintos

### Eje A · Perfil etario (cambia la profundidad de las historias)
Guardián (–13) / Explorador (13-17) / Guardabosques (18+).
Se elige al entrar a un humedal, en [`frontend/humedal.html`](../frontend/humedal.html)
(la reja "¿Quién visita el humedal?"). Se guarda en `ph_perfil`.

### Eje B · Modo de uso de la cuenta
Visitante / **Guardián con tutor** / **Modo escuela-grupo** (sin cupones).
Se elige en [`frontend/cuenta.html`](../frontend/cuenta.html). Se guarda en `ph_modo`.

### Salida grupal / excursión virtual
[`frontend/docente.html`](../frontend/docente.html) — "Salida grupal" en 3 fases
(Armar recorrido → Recorrer en terreno → Resumen), recorridos por curso, y el
botón **"Excursión virtual desde el aula (proyector)"** que abre el tour 360°.

---

## 5. Puntos, cupones y comercios

- **Lógica:** [`frontend/js/puntos.js`](../frontend/js/puntos.js) (puntos, niveles,
  insignias, catálogo de cupones). Hoy es maqueta en `localStorage`.
- **Pantalla de canje:** [`frontend/cupones.html`](../frontend/cupones.html)

---

## 6. La herramienta de monitoreo de nivel (Laguna de los Patos)

Vive anidada en
[`frontend/herramientas/laguna-los-patos/monitoreo-nivel/`](../frontend/herramientas/laguna-los-patos/monitoreo-nivel).
Es una herramienta propia de ese humedal (registro de nivel + dashboard). El hub
de la laguna la enlaza con `MONITOREO_LAGUNA_URL` (en `frontend/js/config.js`).

**Patrón para crecer:** cada herramienta nueva de un humedal va en
`frontend/herramientas/<humedal-id>/<herramienta>/`.

---

## Tabla rápida · "quiero cambiar X → edito Y"

| Quiero cambiar… | Edito… |
|---|---|
| Lista/mapa de humedales | `frontend/data/humedales.json` (+ `.geojson`) |
| Ubicar/orientar un pano | `scripts/panos_geo.py --write` (o a mano `centro`/`norte` en el JSON) |
| Reemplazar una foto 360° | piso el `.jpg` en `frontend/panos/` (mismo nombre) |
| Historias del avatar / animales | `frontend/js/avatar.js` |
| Perfil etario (Guardián/Explorador/Guardabosques) | `frontend/humedal.html` |
| Modo de uso (visitante/tutor/escuela) | `frontend/cuenta.html` |
| Salida grupal / excursión virtual | `frontend/docente.html` |
| Puntos / cupones / comercios | `frontend/js/puntos.js` + `frontend/cupones.html` |
| Monitoreo de nivel de la laguna | `frontend/herramientas/laguna-los-patos/monitoreo-nivel/` |
| Estilos globales | `frontend/css/style.css` |

---

## Deploy (recordatorio)

- **Vercel** sirve `frontend/` como raíz. Cada `push` a `main` en
  `github.com/2xmilo/laguna-los-patos` redeploya `laguna-los-patos.vercel.app`.
- Backends (`backend/`, `backend-laguna-nivel/`) van a Render por separado (aún
  sin desplegar; la web corre en modo demo).
- Supabase `noqcvqatxzpqbtwdnmgk`: esquemas en `supabase/` (aún sin aplicar).

_Ver también el `README.md` de la raíz para el detalle de arquitectura y deploy._

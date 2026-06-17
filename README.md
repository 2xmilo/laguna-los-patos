# Monitoreo Ciudadano · Laguna Los Patos

Mini-aplicación web (QR) para que la comunidad registre el **nivel** de la
Laguna Los Patos. Cada lectura se cruza automáticamente con la estación
**Isla Teja (DMC)** y se calcula la **evapotranspiración (Priestley-Taylor)**.
Todo se guarda en Supabase para construir la serie temporal y, más adelante,
el balance hídrico.

> Proyecto **independiente** de Evergreen. Solo reutiliza la *lógica* de acceso
> a la DMC (copiada en `backend/dmc.py`). No modifica `demo-evergreen` ni
> `precipitacion-backend`.

## Arquitectura

```
[ QR ] → frontend (Vercel, estático)
            │  1. sube foto opcional → Supabase Storage
            │  2. POST /api/lectura { nivel_cm }
            ▼
        backend Flask (Render)
            │  3. cruza con Isla Teja (DMC) en ese momento
            │  4. calcula ET (Priestley-Taylor)
            │  5. inserta lectura + meteo (service_role)
            ▼
        Supabase (DB + Storage)  ← dashboard.html lee directo (anon)
```

El ciudadano **solo ingresa el nivel**. Nunca ve caudal ni balance.

## Estructura

```
monitoreo-ciudadano/
├─ frontend/            # estático → Vercel
│  ├─ index.html        # ficha + formulario del QR
│  ├─ dashboard.html    # serie de nivel pública
│  ├─ css/
│  └─ js/  (config.js ← editar API_URL tras desplegar el backend)
├─ backend/             # Flask → Render
│  ├─ app.py            # endpoints
│  ├─ dmc.py            # funciones DMC + ET (copiadas de Evergreen)
│  └─ .env.example
└─ supabase/
   └─ schema.sql        # ya aplicado al proyecto laguna-los-patos
```

## Estado actual

- ✅ Supabase `laguna-los-patos` creado (`noqcvqatxzpqbtwdnmgk`), esquema y RLS aplicados, bucket `lecturas-fotos` listo.
- ✅ Frontend conectado a Supabase (URL + publishable key en `frontend/js/config.js`).
- ⏳ Backend pendiente de desplegar en Render (código listo).
- ⏳ Falta confirmar el **código de la estación Isla Teja** (ver más abajo).

## Despliegue del backend (Render)

1. Subir `backend/` a un repo Git nuevo (separado de Evergreen).
2. En Render → New → Web Service, apuntar a ese repo. Build: `pip install -r requirements.txt`. Start: usa el `Procfile`.
3. Cargar variables de entorno (ver `backend/.env.example`):
   - `DMC_USER`, `DMC_TOKEN` → **las mismas credenciales DMC de Evergreen**.
   - `ESTACION_ISLA_TEJA` → código de la estación (paso siguiente).
   - `SUPABASE_URL` = `https://noqcvqatxzpqbtwdnmgk.supabase.co`
   - `SUPABASE_SERVICE_KEY` → **service_role** del proyecto laguna (Supabase → Project Settings → API). ⚠️ Solo en el backend, nunca en el frontend.
   - `ALLOWED_ORIGINS` → el dominio Vercel del frontend.
4. Copiar la URL pública de Render en `frontend/js/config.js` (`API_URL`).

### Confirmar el código de la estación Isla Teja

Con `DMC_USER`/`DMC_TOKEN` ya cargados, abrir:

```
https://TU-BACKEND.onrender.com/api/dmc/cercanas
```

Devuelve las estaciones EMA ordenadas por cercanía a la laguna. Tomar el
`codigoNacional` de Isla Teja y ponerlo en `ESTACION_ISLA_TEJA`.

## Despliegue del frontend (Vercel)

- Importar la carpeta `frontend/` como proyecto estático. Sin build.
- Generar el QR apuntando a la URL de `index.html`.

## Prueba local

```bash
cd backend
cp .env.example .env   # completar credenciales
pip install -r requirements.txt
python app.py          # http://localhost:5000
```

Servir el frontend (ej. Live Server en :5500) y enviar una lectura.

## Modelo de datos

| Tabla | Rol |
|-------|-----|
| `lecturas_nivel` | nivel ciudadano (id, creado_en, nivel_cm, foto_url, id_anonimo) |
| `datos_meteorologicos` | cruce Isla Teja + ET, 1:1 con la lectura |

## Próximos pasos (fuera de este MVP)

- Curvas nivel–volumen y nivel–caudal (tras la calibración con data logger).
- Vista de balance hídrico (ΔS, P, ET, Qsalida).
- Módulos: galería iNaturalist/GBIF, gamificación, reporte ciudadano.

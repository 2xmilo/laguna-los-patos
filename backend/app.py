"""
app.py - Backend Monitoreo Ciudadano · Laguna Los Patos

Proyecto INDEPENDIENTE de Evergreen. Reutiliza solo la lógica de acceso a la
DMC (módulo dmc.py, copiado) para:
  1. Recibir la lectura ciudadana de nivel (nivel_cm + foto opcional).
  2. Cruzarla automáticamente con la estación Isla Teja (DMC) en ese momento.
  3. Calcular la evapotranspiración (Priestley-Taylor), igual que Evergreen.
  4. Guardar lectura + meteo + ET en Supabase (proyecto propio).

El ciudadano NUNCA ve caudal ni balance: solo ingresa el nivel.
"""

import os
import json
import time
import logging
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import Flask, request, jsonify
from flask_cors import CORS

import dmc

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


def _cargar_env(ruta='.env'):
    """Carga un .env local (KEY=VALUE) si existe. En Render no hay .env:
    las variables vienen del panel, así que esto no interfiere en producción."""
    if not os.path.exists(ruta):
        return
    with open(ruta, encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if not linea or linea.startswith('#') or '=' not in linea:
                continue
            clave, valor = linea.split('=', 1)
            os.environ.setdefault(clave.strip(), valor.strip())


_cargar_env()

# ── Configuración (variables de entorno en Render) ───────────────────────────
# Código DMC de la estación Isla Teja. NO es secreto, así que vive en el código
# (versionado). Para agregar/cambiar estaciones, editar aquí. Igual se puede
# sobreescribir con la variable de entorno ESTACION_ISLA_TEJA si hiciera falta.
ESTACION_ISLA_TEJA = os.environ.get('ESTACION_ISLA_TEJA', '390015').strip()
SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

LAGUNA_LAT = float(os.environ.get('LAGUNA_LAT', '-39.8098'))
LAGUNA_LON = float(os.environ.get('LAGUNA_LON', '-73.2560'))
NIVEL_MIN_CM = float(os.environ.get('NIVEL_MIN_CM', '0'))
NIVEL_MAX_CM = float(os.environ.get('NIVEL_MAX_CM', '500'))

# Caché en memoria del último registro de Isla Teja (la DMC actualiza ~15 min)
ESTACION_CACHE_SECONDS = int(os.environ.get('ESTACION_CACHE_SECONDS', '600'))
_estacion_cache = {'ts': 0, 'data': None}

app = Flask(__name__)
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        'ALLOWED_ORIGINS',
        'https://laguna-los-patos.vercel.app,http://localhost:5500,http://127.0.0.1:5500,null'
    ).split(',')
    if o.strip()
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})


# ── Supabase REST (service role: inserta saltándose RLS) ─────────────────────
def supabase_insert(table, row):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError('Supabase no configurado: define SUPABASE_URL y SUPABASE_SERVICE_KEY')
    payload = json.dumps(row).encode('utf-8')
    req = Request(
        f'{SUPABASE_URL}/rest/v1/{table}',
        data=payload,
        headers={
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
        method='POST',
    )
    with urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data[0] if isinstance(data, list) and data else data


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.route('/')
def root():
    return jsonify({'app': 'Laguna Los Patos · Monitoreo Ciudadano', 'status': 'ok'})


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'ok': True,
        'estacion_configurada': bool(ESTACION_ISLA_TEJA),
        'supabase_configurado': bool(SUPABASE_URL and SUPABASE_SERVICE_KEY),
    })


@app.route('/api/estacion/actual', methods=['GET', 'OPTIONS'])
def estacion_actual():
    """Último registro de Isla Teja + ET. Público y cacheado (~10 min) para
    no golpear la DMC en cada visita. No escribe en Supabase."""
    if request.method == 'OPTIONS':
        return '', 200

    if not ESTACION_ISLA_TEJA:
        return jsonify({'ok': False, 'error': 'Estación no configurada'}), 500

    now = time.time()
    if _estacion_cache['data'] and (now - _estacion_cache['ts'] < ESTACION_CACHE_SECONDS):
        return jsonify(_estacion_cache['data'])

    try:
        estacion, obs = dmc.get_latest_observation(ESTACION_ISLA_TEJA)
        if not obs:
            return jsonify({'ok': False, 'error': 'Sin datos recientes'}), 200
        et = dmc.et_priestley_taylor(
            obs.get('temperatura_c'), obs.get('radiacion_global_w_m2'), interval_min=60)
        data = {
            'ok': True,
            'estacion': estacion.get('nombreEstacion'),
            'codigo': estacion.get('codigoNacional') or ESTACION_ISLA_TEJA,
            'momento_local': dmc._to_chile_local(obs.get('momento')),
            'temperatura_c': obs.get('temperatura_c'),
            'humedad_relativa_pct': obs.get('humedad_relativa_pct'),
            'radiacion_global_w_m2': obs.get('radiacion_global_w_m2'),
            'presion_hpa': obs.get('presion_estacion_hpa'),
            'precipitacion_24h_mm': obs.get('precipitacion_24h_mm'),
            'viento_kt': obs.get('viento_kt'),
            'viento_dir_grados': obs.get('viento_dir_grados'),
            'et_priestley_mm_h': et,
        }
        _estacion_cache['ts'] = now
        _estacion_cache['data'] = data
        return jsonify(data)
    except Exception as e:
        logger.warning(f'estacion actual error: {e}')
        # si hay caché viejo, devolverlo antes que fallar
        if _estacion_cache['data']:
            return jsonify(_estacion_cache['data'])
        return jsonify({'ok': False, 'error': 'No se pudo consultar la DMC'}), 502


@app.route('/api/dmc/cercanas', methods=['GET', 'OPTIONS'])
def dmc_cercanas():
    """Helper: lista estaciones EMA cercanas a la laguna para identificar
    el código de Isla Teja. Usar una vez con credenciales DMC cargadas."""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        lat = float(request.args.get('lat', LAGUNA_LAT))
        lon = float(request.args.get('lon', LAGUNA_LON))
        return jsonify({'estaciones': dmc.get_nearby_stations(lat, lon, limit=8)})
    except Exception as e:
        logger.error(f'DMC cercanas error: {e}', exc_info=True)
        return jsonify({'error': 'No se pudo consultar la DMC', 'detalle': str(e)}), 502


@app.route('/api/lectura', methods=['POST', 'OPTIONS'])
def crear_lectura():
    """Registra una lectura ciudadana de nivel, la cruza con Isla Teja y
    calcula la ET. Guarda lectura + meteo en Supabase."""
    if request.method == 'OPTIONS':
        return '', 200

    body = request.get_json(silent=True) or {}

    # 1. Validar nivel
    nivel = body.get('nivel_cm')
    try:
        nivel = float(nivel)
    except (TypeError, ValueError):
        return jsonify({'error': 'nivel_cm debe ser un número'}), 400
    if not (NIVEL_MIN_CM <= nivel <= NIVEL_MAX_CM):
        return jsonify({'error': f'nivel_cm fuera de rango ({NIVEL_MIN_CM}-{NIVEL_MAX_CM} cm)'}), 400

    foto_url = (body.get('foto_url') or '').strip() or None
    id_anonimo = (body.get('id_anonimo') or '').strip() or None

    if not ESTACION_ISLA_TEJA:
        return jsonify({'error': 'Estación Isla Teja no configurada (ESTACION_ISLA_TEJA)'}), 500

    # 2. Sello de tiempo del servidor (UTC)
    creado_en = datetime.now(timezone.utc).isoformat()

    # 3. Cruce con la DMC (Isla Teja) — no bloquea la lectura si falla
    meteo = None
    meteo_error = None
    try:
        estacion, obs = dmc.get_latest_observation(ESTACION_ISLA_TEJA)
        if obs:
            et = dmc.et_priestley_taylor(
                obs.get('temperatura_c'),
                obs.get('radiacion_global_w_m2'),
                interval_min=60,  # mm/h
            )
            meteo = {
                'estacion_codigo': estacion.get('codigoNacional') or ESTACION_ISLA_TEJA,
                'estacion_nombre': estacion.get('nombreEstacion'),
                'momento_utc': obs.get('momento'),
                'momento_local': dmc._to_chile_local(obs.get('momento')),
                'temperatura_c': obs.get('temperatura_c'),
                'humedad_relativa_pct': obs.get('humedad_relativa_pct'),
                'radiacion_global_w_m2': obs.get('radiacion_global_w_m2'),
                'presion_hpa': obs.get('presion_estacion_hpa'),
                'precipitacion_minuto_mm': obs.get('precipitacion_minuto_mm'),
                'precipitacion_24h_mm': obs.get('precipitacion_24h_mm'),
                'viento_kt': obs.get('viento_kt'),
                'viento_dir_grados': obs.get('viento_dir_grados'),
                'et_priestley_mm_h': et,
            }
    except Exception as e:
        meteo_error = str(e)
        logger.warning(f'No se pudo cruzar con DMC: {e}')

    # 4. Guardar en Supabase
    try:
        lectura = supabase_insert('lecturas_nivel', {
            'creado_en': creado_en,
            'nivel_cm': nivel,
            'foto_url': foto_url,
            'id_anonimo': id_anonimo,
            'meteo_ok': meteo is not None,
        })
        lectura_id = lectura.get('id')

        if meteo:
            meteo_row = dict(meteo)
            meteo_row['lectura_id'] = lectura_id
            supabase_insert('datos_meteorologicos', meteo_row)
    except HTTPError as e:
        detalle = e.read().decode('utf-8', errors='ignore')
        logger.error(f'Supabase insert HTTPError {e.code}: {detalle[:300]}')
        return jsonify({'error': 'No se pudo guardar la lectura', 'detalle': detalle[:300]}), 502
    except (URLError, RuntimeError) as e:
        logger.error(f'Supabase insert error: {e}')
        return jsonify({'error': 'No se pudo guardar la lectura', 'detalle': str(e)}), 502

    return jsonify({
        'ok': True,
        'id': lectura_id,
        'nivel_cm': nivel,
        'meteo_ok': meteo is not None,
        'meteo_error': meteo_error,
        # Resumen mínimo (no se muestra caudal ni balance al ciudadano)
        'mensaje': '¡Gracias! Tu medición quedó registrada.',
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

"""
dmc.py - Acceso a la API de la DMC (Dirección Meteorológica de Chile)

Funciones PURAS extraídas del backend de Evergreen (precipitacion-backend/app.py).
NO se modifica el proyecto original: esto es una copia autónoma para el
Monitoreo Ciudadano de la Laguna Los Patos.

Solo se necesita la estación Isla Teja para el cruce meteorológico y el
cálculo de evapotranspiración (Priestley-Taylor).
"""

import os
import re
import json
import math
from datetime import datetime, timedelta
from urllib.parse import urlencode
from urllib.request import Request, urlopen

DMC_BASE_URL = 'https://climatologia.meteochile.gob.cl/application'


# ─────────────────────────────────────────────────────────────────────────────
# Credenciales y request a la DMC
# ─────────────────────────────────────────────────────────────────────────────
def _dmc_credentials():
    user = os.environ.get('DMC_USER') or os.environ.get('DMC_USUARIO')
    token = os.environ.get('DMC_TOKEN') or os.environ.get('DMC_API_KEY')
    if not user or not token:
        raise RuntimeError('DMC no configurado: define DMC_USER y DMC_TOKEN')
    return user, token


def _fix_dmc_encoding(obj):
    """Corrige mojibake UTF-8→Latin-1 en respuestas DMC."""
    if isinstance(obj, str):
        try:
            return obj.encode('latin-1').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            return obj
    if isinstance(obj, dict):
        return {k: _fix_dmc_encoding(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_fix_dmc_encoding(i) for i in obj]
    return obj


def dmc_get_json(path, timeout=25):
    user, token = _dmc_credentials()
    query = urlencode({'usuario': user, 'token': token})
    url = f"{DMC_BASE_URL}/{path}?{query}"
    req = Request(
        url,
        headers={
            'Accept': 'application/json,text/plain,*/*',
            'User-Agent': 'Mozilla/4.0 (compatible; Laguna Los Patos MVP)',
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode('utf-8-sig', errors='replace').strip()
    if not body or body[0] not in '[{':
        raise RuntimeError('DMC no devolvio JSON para ' + path)
    return _fix_dmc_encoding(json.loads(body))


# ─────────────────────────────────────────────────────────────────────────────
# Normalización
# ─────────────────────────────────────────────────────────────────────────────
def _to_float(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.search(r'-?\d+(?:[.,]\d+)?', str(value))
    if not match:
        return None
    return float(match.group(0).replace(',', '.'))


def _station_code(value):
    return str(value or '').strip()


def _first_item(value):
    if isinstance(value, list):
        return value[0] if value else {}
    if isinstance(value, dict):
        return value
    return {}


def normalize_station(raw):
    lat = _to_float(raw.get('latitud') or raw.get('LatitudDecimal'))
    lon = _to_float(raw.get('longitud') or raw.get('LongitudDecimal'))
    if lat is None or lon is None:
        return None
    return {
        'codigoNacional': _station_code(raw.get('codigoNacional') or raw.get('CodigoNacional')),
        'nombreEstacion': raw.get('nombreEstacion') or raw.get('NombreEstacion') or 'Estacion DMC',
        'latitud': lat,
        'longitud': lon,
        'altura': _to_float(raw.get('altura') or raw.get('Altura')),
        'region': raw.get('NombreRegion') or raw.get('region') or raw.get('Region') or '',
    }


def normalize_observation(obs):
    return {
        'momento': obs.get('momento'),
        'temperatura_c': _to_float(obs.get('temperatura')),
        'punto_rocio_c': _to_float(obs.get('puntoDeRocio')),
        'humedad_relativa_pct': _to_float(obs.get('humedadRelativa')),
        'radiacion_global_w_m2': _to_float(obs.get('radiacionGlobalInst')),
        'presion_estacion_hpa': _to_float(obs.get('presionEstacion')),
        'precipitacion_minuto_mm': _to_float(obs.get('aguaCaidaDelMinuto')),
        'precipitacion_6h_mm': _to_float(obs.get('aguaCaida6Horas')),
        'precipitacion_24h_mm': _to_float(obs.get('aguaCaida24Horas')),
        'viento_dir_grados': _to_float(obs.get('direccionDelViento')),
        'viento_kt': _to_float(obs.get('fuerzaDelViento')),
        'viento_prom_2m_kt': _to_float(obs.get('fuerzaDelVientoPromedio2Minutos')),
    }


def _to_chile_local(momento_str):
    """UTC → hora local Chile. UTC-4 invierno (abr-sep), UTC-3 verano (oct-mar)."""
    if not momento_str:
        return ''
    try:
        dt = datetime.strptime(str(momento_str)[:19], '%Y-%m-%d %H:%M:%S')
        offset = -4 if 4 <= dt.month <= 9 else -3
        return (dt + timedelta(hours=offset)).strftime('%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError):
        return ''


def _haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─────────────────────────────────────────────────────────────────────────────
# Cálculo climático — Evapotranspiración Priestley-Taylor
# (idéntico al de Evergreen: ideal para humedales, solo requiere T y radiación)
# ─────────────────────────────────────────────────────────────────────────────
def et_priestley_taylor(T_c, Rs_W, interval_min=60):
    """ET Priestley-Taylor [mm] para el intervalo dado.
    T_c: temperatura aire [°C], Rs_W: radiación solar [W/m²].
    Con interval_min=60 el resultado es mm/h (tasa instantánea).
    """
    if T_c is None or Rs_W is None:
        return None
    try:
        T = float(T_c)
        Rs = max(float(Rs_W), 0.0)
        es = 0.6108 * math.exp(17.27 * T / (T + 237.3))
        delta = 4098 * es / (T + 237.3) ** 2
        Rn = 0.77 * Rs * 3600 * interval_min / 60 / 1e6  # W/m² → MJ/m²
        if Rn <= 0:
            return 0.0
        return round(max(1.26 * (delta / (delta + 0.066)) * (Rn / 2.45), 0.0), 6)
    except (ValueError, ZeroDivisionError):
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Helpers de alto nivel para la app
# ─────────────────────────────────────────────────────────────────────────────
def get_latest_observation(codigo):
    """Obtiene la observación EMA más reciente de una estación.
    Devuelve (estacion_dict, observacion_normalizada_dict) o (estacion, None).
    """
    data = dmc_get_json(f'servicios/getDatosRecientesEma/{codigo}', timeout=30)
    bundle = _first_item(data.get('datosEstaciones')) or {}
    station = normalize_station(bundle.get('estacion') or {}) or {'codigoNacional': codigo}
    observaciones = bundle.get('datos') or []
    if not observaciones:
        return station, None
    # DMC devuelve descendente (más reciente primero)
    latest = normalize_observation(observaciones[0])
    return station, latest


def get_nearby_stations(lat, lon, limit=8):
    """Lista estaciones EMA ordenadas por cercanía. Útil para identificar
    el código de la estación Isla Teja una vez configuradas las credenciales.
    """
    data = dmc_get_json('servicios/getEstacionesRedEma', timeout=25)
    ranked = []
    for raw in data.get('datosEstacion', []):
        st = normalize_station(raw)
        if not st or not st['codigoNacional']:
            continue
        st['distance_km'] = round(_haversine_km(lat, lon, st['latitud'], st['longitud']), 2)
        ranked.append(st)
    ranked.sort(key=lambda s: s['distance_km'])
    return ranked[:limit]

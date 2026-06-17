"""
test_dmc_local.py - Prueba LOCAL de la conexión con la DMC (sin Supabase ni Render)

Verifica toda la cadena DMC → ET:
  1. Busca estaciones EMA cercanas a la laguna (para identificar Isla Teja).
  2. Trae la última observación de la estación elegida.
  3. Calcula la evapotranspiración (Priestley-Taylor).

Uso:
    python test_dmc_local.py            # lista estaciones cercanas
    python test_dmc_local.py 360042     # + datos y ET de esa estación

Requisitos: completar DMC_USER y DMC_TOKEN en el archivo .env.
"""

import os
import sys

import dmc

# Consola de Windows: forzar UTF-8 para poder imprimir acentos/emojis
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass


def cargar_env(ruta='.env'):
    """Carga un .env simple (KEY=VALUE) a os.environ, sin dependencias."""
    if not os.path.exists(ruta):
        print(f'⚠️  No se encontró {ruta}. Crea el archivo con DMC_USER y DMC_TOKEN.')
        return
    with open(ruta, encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if not linea or linea.startswith('#') or '=' not in linea:
                continue
            clave, valor = linea.split('=', 1)
            os.environ.setdefault(clave.strip(), valor.strip())


def main():
    cargar_env()

    if not os.environ.get('DMC_USER') or not os.environ.get('DMC_TOKEN'):
        print('❌ Falta DMC_USER o DMC_TOKEN en el .env. Complétalos y vuelve a correr.')
        sys.exit(1)

    lat = float(os.environ.get('LAGUNA_LAT', '-39.8098'))
    lon = float(os.environ.get('LAGUNA_LON', '-73.2560'))

    # 1. Estaciones cercanas a la laguna
    print(f'\n📍 Estaciones EMA más cercanas a la laguna ({lat}, {lon}):\n')
    try:
        estaciones = dmc.get_nearby_stations(lat, lon, limit=8)
    except Exception as e:
        print(f'❌ Error consultando la DMC: {e}')
        sys.exit(1)

    print(f'{"código":>10}  {"dist":>7}  estación')
    print('-' * 55)
    for st in estaciones:
        print(f'{st["codigoNacional"]:>10}  {st["distance_km"]:>5} km  '
              f'{st["nombreEstacion"]} ({st.get("region", "")})')

    # 2 y 3. Si pasaron un código, traer datos + ET
    codigo = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('ESTACION_ISLA_TEJA', '').strip()
    if not codigo:
        print('\n👉 Identifica el código de Isla Teja arriba y corre:')
        print('   python test_dmc_local.py <codigo>')
        return

    print(f'\n🌡️  Última observación de la estación {codigo}:\n')
    estacion, obs = dmc.get_latest_observation(codigo)
    print(f'   Estación: {estacion.get("nombreEstacion")}  ({estacion.get("codigoNacional")})')
    if not obs:
        print('   ⚠️ Sin observaciones recientes.')
        return

    print(f'   Momento (UTC):  {obs.get("momento")}')
    print(f'   Momento local:  {dmc._to_chile_local(obs.get("momento"))}')
    print(f'   Temperatura:    {obs.get("temperatura_c")} °C')
    print(f'   Humedad rel.:   {obs.get("humedad_relativa_pct")} %')
    print(f'   Radiación:      {obs.get("radiacion_global_w_m2")} W/m²')
    print(f'   PP 24h:         {obs.get("precipitacion_24h_mm")} mm')
    print(f'   Viento:         {obs.get("viento_kt")} kt')

    et = dmc.et_priestley_taylor(
        obs.get('temperatura_c'),
        obs.get('radiacion_global_w_m2'),
        interval_min=60,
    )
    print(f'\n💧 Evapotranspiración (Priestley-Taylor): {et} mm/h')
    print('   ✅ La cadena DMC → ET funciona en local.\n')


if __name__ == '__main__':
    main()

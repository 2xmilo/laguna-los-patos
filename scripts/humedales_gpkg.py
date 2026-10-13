"""Genera frontend/data/humedales.geojson desde el GeoPackage oficial (solo lectura).
Uso (desde RedHumedal/):
  python scripts/humedales_gpkg.py "../Red Isla Teja Oficial.gpkg" frontend/data/humedales.geojson frontend/data/humedales.json
Un humedal nuevo en el GeoPackage necesita su id en IDS y su ficha en humedales.json."""
import json, sys, warnings
import geopandas as gpd
from shapely.geometry import mapping, Point, MultiPolygon

warnings.filterwarnings('ignore')
gpkg, salida, json_app = sys.argv[1], sys.argv[2], sys.argv[3]

IDS = {
    'Santuario Rio Cruces': 'rio-cruces',
    'Los Arayanes': 'los-arayanes',
    'CONAF': 'conaf',
    'La Cancha': 'humedal-cancha',
    'Santa Ines': 'santa-ines',
    'Laguna de Los Patos': 'laguna-los-patos',
    'Los Pidenes': 'los-pidenes',
    'Los Pelues': 'los-pelues',
    'Plaza Los Helechos': 'plaza-los-helechos',
    'FACEA': 'facea',
    'Campus Isla Teja': 'campus-isla-teja',
    'Laguna de Los Lotos': 'laguna-los-lotos',
    'Parque Botánico': 'parque-botanico',
    'Muelle Saval': 'muelle-saval',
    'Arboretum': 'arboretum',
}

g = gpd.read_file(gpkg)
assert g.crs.to_epsg() == 4326, g.crs
area = g.to_crs(32718).geometry.area / 1e4
faltan = set(g.nombre_hum) - set(IDS)
assert not faltan, faltan

def redondear(o):
    if isinstance(o, (list, tuple)):
        return [redondear(x) for x in o]
    return round(o, 6)

features, info = [], {}
for i, r in g.iterrows():
    geom = r.geometry
    if geom.geom_type == 'Polygon':
        geom = MultiPolygon([geom])
    geom = geom.buffer(0) if not geom.is_valid else geom
    m = mapping(geom)
    hid = IDS[r.nombre_hum]
    rep = r.geometry.representative_point()
    info[hid] = {'ha': round(float(area[i]), 2), 'punto': [round(rep.y, 5), round(rep.x, 5)], 'geom': r.geometry}
    features.append({
        'type': 'Feature',
        'properties': {'id': hid, 'nombre': r.nombre_hum, 'ha': round(float(area[i]), 2), 'fuente': 'Red Isla Teja Oficial'},
        'geometry': {'type': 'MultiPolygon', 'coordinates': redondear(m['coordinates'])},
    })

with open(salida, 'w', encoding='utf-8') as f:
    json.dump({'type': 'FeatureCollection', 'features': features}, f, ensure_ascii=False)
    f.write('\n')

# Chequeo: el pin (centro) de cada humedal de la app cae dentro de su polígono
app = json.load(open(json_app, encoding='utf-8'))
for h in app['humedales']:
    if h['id'] in info:
        dentro = info[h['id']]['geom'].contains(Point(h['centro'][1], h['centro'][0]))
        print(f"{h['id']:<20} pin dentro={dentro}  punto_interior={info[h['id']]['punto']}  {info[h['id']]['ha']} ha")
    else:
        print(f"{h['id']:<20} SIN POLIGONO OFICIAL")
print(json.dumps({k: {'ha': v['ha'], 'punto': v['punto']} for k, v in info.items()}, ensure_ascii=False))

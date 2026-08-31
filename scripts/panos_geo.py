#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
panos_geo.py  ·  Mapea automáticamente los panos 360° del dron.

Lee el GPS y el rumbo (GimbalYawDegree) que las capturas DJI guardan en su
metadata (EXIF + XMP) y completa `centro` [lat, lon] y `norte` (grados) de cada
estación en frontend/data/humedales.json.

Por qué existe: la ubicación y orientación de cada tour NO se toman del EXIF en
tiempo de ejecución, sino de esos dos campos del JSON. Este script evita
copiarlos a mano y arregla el problema típico de panos que quedan mal orientados
porque su `norte` no se cargó.

Uso (desde la raíz del repo, o desde cualquier lado):
    python scripts/panos_geo.py            # DRY-RUN: solo muestra qué cambiaría
    python scripts/panos_geo.py --write    # aplica los cambios al JSON

Notas:
- `norte` = GimbalYawDegree (hacia dónde apuntaba la cámara). Es el criterio con
  el que quedó bien orientada la estación si-mirador.
- Solo toca estaciones cuyo pano tenga metadata real (capturas del dron). Los
  panos de muestra (placeholders, sin GPS) se dejan intactos.
- Preserva el formato del JSON (reemplazo quirúrgico, no reescribe todo el
  archivo).
"""
import os, re, sys, json, argparse
sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image, ExifTags
from PIL.ExifTags import GPSTAGS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
JSON_PATH = os.path.join(ROOT, "data", "humedales.json")


def _dms_a_grados(v, ref):
    d, m, s = [float(x) for x in v]
    val = d + m / 60 + s / 3600
    return round(-val if ref in ("S", "W") else val, 7)


def leer_metadata(path):
    """Devuelve {lat, lon, gimbal, flight} o None si la foto no tiene GPS."""
    img = Image.open(path)
    ex = img.getexif()
    lat = lon = gimbal = flight = None
    gps = ex.get_ifd(0x8825) if ex else None
    if gps:
        g = {GPSTAGS.get(k, k): v for k, v in gps.items()}
        if g.get("GPSLatitude"):
            lat = _dms_a_grados(g["GPSLatitude"], g.get("GPSLatitudeRef"))
        if g.get("GPSLongitude"):
            lon = _dms_a_grados(g["GPSLongitude"], g.get("GPSLongitudeRef"))
    txt = open(path, "rb").read(300000).decode("latin-1", "ignore")
    mg = re.search(r'GimbalYawDegree\s*=\s*"([^"]*)"', txt)
    mf = re.search(r'FlightYawDegree\s*=\s*"([^"]*)"', txt)
    if mg:
        gimbal = round(float(mg.group(1)), 1)
    if mf:
        flight = round(float(mf.group(1)), 1)
    if lat is None or lon is None:
        return None
    return {"lat": lat, "lon": lon, "gimbal": gimbal, "flight": flight}


def _set_campo(texto, slug, campo, nuevo_valor_str):
    """Reemplaza el valor de `campo` dentro del objeto de la estación `slug`,
    preservando todo el resto del formato. Devuelve (texto, cambió?)."""
    patron = re.compile(
        r'("' + re.escape(slug) + r'"\s*:\s*\{[^{}]*?"' + re.escape(campo) + r'"\s*:\s*)'
        r'(\[[^\]]*\]|-?\d+(?:\.\d+)?)',
        re.DOTALL,
    )
    m = patron.search(texto)
    if not m:
        return texto, False
    if m.group(2) == nuevo_valor_str:
        return texto, False
    nuevo = texto[: m.start(2)] + nuevo_valor_str + texto[m.end(2):]
    return nuevo, True


def main():
    ap = argparse.ArgumentParser(description="Mapea panos del dron -> humedales.json")
    ap.add_argument("--write", action="store_true", help="aplica los cambios (sin esto, solo muestra)")
    args = ap.parse_args()

    raw = open(JSON_PATH, encoding="utf-8").read()
    data = json.loads(raw)
    estaciones = data.get("estaciones", {})

    cambios = []
    print("Estacion            | centro (lat,lon)                 | norte")
    print("-" * 72)
    for slug, est in estaciones.items():
        pano = est.get("pano")
        p = os.path.join(ROOT, pano) if pano else None
        if not p or not os.path.exists(p):
            print(f"  {slug:18}| pano faltante: {pano}")
            continue
        meta = leer_metadata(p)
        if meta is None:
            print(f"  {slug:18}| SIN METADATA (placeholder) -> se deja manual")
            continue

        centro_str = f"[{meta['lat']}, {meta['lon']}]"
        norte_val = meta["gimbal"] if meta["gimbal"] is not None else meta["flight"]
        norte_str = str(norte_val)

        c_actual = est.get("centro")
        n_actual = est.get("norte")
        cambia_c = (c_actual is None) or (round(c_actual[0], 7) != meta["lat"] or round(c_actual[1], 7) != meta["lon"])
        cambia_n = str(n_actual) != norte_str
        marca = []
        if cambia_c: marca.append("centro")
        if cambia_n: marca.append(f"norte {n_actual}->{norte_str}")
        print(f"  {slug:18}| {centro_str:32}| {norte_str:6} {'  <= ' + ', '.join(marca) if marca else ''}")

        if cambia_c or cambia_n:
            cambios.append((slug, centro_str, norte_str, cambia_c, cambia_n))

    if not cambios:
        print("\nTodo al día: nada que cambiar.")
        return

    if not args.write:
        print(f"\nDRY-RUN: {len(cambios)} estacion(es) cambiarían. Corré con --write para aplicar.")
        return

    texto = raw
    for slug, centro_str, norte_str, cambia_c, cambia_n in cambios:
        if cambia_c:
            texto, _ = _set_campo(texto, slug, "centro", centro_str)
        if cambia_n:
            texto, _ = _set_campo(texto, slug, "norte", norte_str)
    json.loads(texto)  # valida que sigue siendo JSON correcto
    open(JSON_PATH, "w", encoding="utf-8").write(texto)
    print(f"\nOK: {len(cambios)} estacion(es) actualizadas en {os.path.relpath(JSON_PATH, os.path.dirname(__file__))}")


if __name__ == "__main__":
    main()

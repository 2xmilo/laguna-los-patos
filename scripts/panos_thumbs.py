#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
panos_thumbs.py  ·  Genera las miniaturas de la barra de estaciones del tour.

Por qué existe: la barra inferior de `tour.html` muestra cada estación en un
círculo de 62 px, pero usaba el pano completo (6000x3000, 3-5 MB) como
`background-image`. Entrar a Santa Inés bajaba ~19 MB antes de mostrar nada.

Este script recorta el **cuadrado central** de cada pano —exactamente el encuadre
que el círculo ya mostraba con `background-size: cover`— y lo guarda a 160 px en
`frontend/panos/thumbs/`. La apariencia no cambia; el peso baja ~99%.

Uso (desde cualquier lado):
    python scripts/panos_thumbs.py            # DRY-RUN: muestra qué generaría
    python scripts/panos_thumbs.py --write    # genera los archivos

Al agregar un pano nuevo: ponelo en `panos/`, agregalo como estación en
`humedales.json` y corré esto con `--write`. Si falta una miniatura, `tour.html`
cae de vuelta al pano completo, así que nunca se rompe: solo pesa más.
"""
import os
import sys
import json
import argparse

sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
JSON_PATH = os.path.join(ROOT, "data", "humedales.json")
THUMBS_DIR = os.path.join(ROOT, "panos", "thumbs")
LADO = 160


def nombre_thumb(pano):
    """panos/si-mirador.jpg -> si-mirador.jpg  ·  panos/sn-pampa.JPG -> sn-pampa.jpg"""
    return os.path.splitext(os.path.basename(pano))[0] + ".jpg"


def main():
    ap = argparse.ArgumentParser(description="Genera thumbnails de los panos del tour")
    ap.add_argument("--write", action="store_true", help="genera los archivos (sin esto, solo muestra)")
    args = ap.parse_args()

    data = json.load(open(JSON_PATH, encoding="utf-8"))
    estaciones = data.get("estaciones", {})

    if args.write:
        os.makedirs(THUMBS_DIR, exist_ok=True)

    total_antes = total_despues = 0
    print(f"{'Estacion':18}| pano      | thumb")
    print("-" * 52)
    for slug, est in estaciones.items():
        pano = est.get("pano")
        src = os.path.join(ROOT, pano) if pano else None
        if not src or not os.path.exists(src):
            print(f"  {slug:16}| FALTA {pano}")
            continue

        destino = os.path.join(THUMBS_DIR, nombre_thumb(pano))
        peso_src = os.path.getsize(src)
        total_antes += peso_src

        im = Image.open(src).convert("RGB")
        # Mismo encuadre que `background-size: cover` en un círculo: cuadrado central.
        lado = min(im.width, im.height)
        izq = (im.width - lado) // 2
        arr = (im.height - lado) // 2
        im = im.crop((izq, arr, izq + lado, arr + lado)).resize((LADO, LADO), Image.LANCZOS)

        if args.write:
            im.save(destino, "JPEG", quality=82, optimize=True)
            peso_dst = os.path.getsize(destino)
        else:
            peso_dst = 0
        total_despues += peso_dst

        print(f"  {slug:16}| {peso_src/1e6:5.1f} MB  | {nombre_thumb(pano)}"
              f"{f'  ({peso_dst/1024:.0f} KB)' if args.write else ''}")

    if not args.write:
        print(f"\nDRY-RUN: {len(estaciones)} miniaturas de {LADO}x{LADO} px se generarian en "
              f"{os.path.relpath(THUMBS_DIR, os.path.dirname(__file__))}. Corré con --write.")
    else:
        print(f"\nOK: {total_antes/1e6:.1f} MB de panos -> {total_despues/1024:.0f} KB de miniaturas.")


if __name__ == "__main__":
    main()

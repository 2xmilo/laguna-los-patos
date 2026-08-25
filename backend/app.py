"""
Backend Flask · Plataforma Digital de Humedales Urbanos (piloto Isla Teja)
- /api/avistamiento : recibe foto + coords, la identifica con la IA de visión
  de iNaturalist (score API), strip EXIF, guarda en Supabase (ph_avistamientos).
- /api/denuncia     : recibe denuncia anónima (sin user_id), strip EXIF,
  guarda en Supabase (ph_denuncias) para el panel municipal.

Comparte el proyecto Supabase con monitoreo-ciudadano; usa tablas ph_*.
No toca las tablas del monitoreo de nivel.
"""
import os
import io
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)

ALLOWED = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(app, resources={r"/api/*": {"origins": ALLOWED.split(",") if ALLOWED != "*" else "*"}})

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://noqcvqatxzpqbtwdnmgk.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")  # service_role — solo backend
BUCKET = os.environ.get("PH_BUCKET", "humedales-fotos")

# --- iNaturalist -----------------------------------------------------------
# El endpoint de visión (score_image) NO es público: requiere un JWT de una
# cuenta iNaturalist (se obtiene logueado en
# https://www.inaturalist.org/users/api_token — dura ~24 h, ver README).
# Sin token, el backend guarda el avistamiento sin especie y lo deja
# pendiente de identificación comunitaria.
INAT_SCORE_URL = "https://api.inaturalist.org/v1/computervision/score_image"
INAT_API_TOKEN = os.environ.get("INAT_API_TOKEN", "")

# Especies-objetivo del humedal (para ponderar / filtrar resultados de la IA).
ESPECIES_HUMEDAL = {
    "Cygnus melancoryphus", "Ardea alba", "Rhinoderma darwinii",
    "Dromiciops gliroides", "Vanellus chilensis", "Fulica",
    "Anas", "Egretta", "Phalacrocorax", "Theristicus",
}


def _strip_exif(file_storage):
    """Devuelve (bytes_jpeg_sin_exif). Elimina metadatos de ubicación/dispositivo."""
    img = Image.open(file_storage.stream).convert("RGB")
    # Reescala para la llamada a la IA y para ahorrar almacenamiento.
    img.thumbnail((1024, 1024))
    limpio = Image.new("RGB", img.size)
    limpio.putdata(list(img.getdata()))
    out = io.BytesIO()
    limpio.save(out, format="JPEG", quality=85)
    out.seek(0)
    return out


def _identificar(jpeg_bytes, lat, lon):
    """Llama a la IA de visión de iNaturalist, ponderada por espacio-tiempo.
    Requiere INAT_API_TOKEN; sin él devuelve (None, 0)."""
    if not INAT_API_TOKEN:
        return None, 0.0
    try:
        files = {"image": ("foto.jpg", jpeg_bytes, "image/jpeg")}
        data = {"lat": lat, "lng": lon}
        headers = {"Authorization": INAT_API_TOKEN}
        r = requests.post(INAT_SCORE_URL, files=files, data=data,
                          headers=headers, timeout=25)
        r.raise_for_status()
        results = r.json().get("results", [])
        if not results:
            return None, 0.0
        top = results[0]
        taxon = top.get("taxon", {})
        nombre = taxon.get("name")
        comun = (taxon.get("preferred_common_name") or "").strip()
        score = float(top.get("combined_score", top.get("vision_score", 0))) / 100.0
        etiqueta = nombre + (" (" + comun + ")" if comun else "")
        return etiqueta, round(score, 3)
    except Exception:
        return None, 0.0


def _supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def _subir_foto(jpeg_bytes, nombre):
    """Sube la foto (sin EXIF) al bucket de Storage. Devuelve URL pública o None."""
    if not SUPABASE_SERVICE_KEY:
        return None
    try:
        url = SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + nombre
        h = {"apikey": SUPABASE_SERVICE_KEY,
             "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
             "Content-Type": "image/jpeg", "x-upsert": "true"}
        jpeg_bytes.seek(0)
        requests.post(url, headers=h, data=jpeg_bytes.read(), timeout=20)
        return SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + nombre
    except Exception:
        return None


def _insertar(tabla, fila):
    if not SUPABASE_SERVICE_KEY:
        return False
    r = requests.post(SUPABASE_URL + "/rest/v1/" + tabla,
                      headers=_supabase_headers(), data=json.dumps(fila), timeout=20)
    return r.status_code in (200, 201, 204)


@app.route("/api/salud")
def salud():
    return jsonify(ok=True, supabase=bool(SUPABASE_SERVICE_KEY))


@app.route("/api/avistamiento", methods=["POST"])
def avistamiento():
    foto = request.files.get("foto")
    if not foto:
        return jsonify(error="falta la foto"), 400
    lat = request.form.get("lat"); lon = request.form.get("lon")
    humedal_id = request.form.get("humedal_id", "laguna-los-patos")

    limpio = _strip_exif(foto)
    especie, conf = _identificar(limpio, lat, lon)
    nombre_arch = "avist_" + os.urandom(6).hex() + ".jpg"
    foto_url = _subir_foto(limpio, nombre_arch)

    fila = {
        "humedal_id": humedal_id, "lat": float(lat) if lat else None,
        "lon": float(lon) if lon else None, "especie": especie,
        "confianza": conf, "foto_url": foto_url,
        "grado_investigacion": False,
    }
    _insertar("ph_avistamientos", fila)
    if especie:
        return jsonify(especie=especie, confianza=conf)
    return jsonify(
        especie="Registrado — pendiente de identificación",
        confianza=0,
        nota="IA no disponible (falta INAT_API_TOKEN) o sin match claro; el avistamiento quedó guardado.",
    )


@app.route("/api/denuncia", methods=["POST"])
def denuncia():
    # Denuncia anónima: nunca se guarda user_id ni datos identificatorios.
    humedal_id = request.form.get("humedal_id", "laguna-los-patos")
    tipo = request.form.get("tipo", "otro")
    descripcion = request.form.get("descripcion", "")
    lat = request.form.get("lat"); lon = request.form.get("lon")

    foto_url = None
    foto = request.files.get("foto")
    if foto:
        limpio = _strip_exif(foto)  # elimina EXIF (ubicación exacta + modelo de teléfono)
        foto_url = _subir_foto(limpio, "denuncia_" + os.urandom(6).hex() + ".jpg")

    fila = {
        "humedal_id": humedal_id, "tipo": tipo, "descripcion": descripcion,
        "lat": float(lat) if lat else None, "lon": float(lon) if lon else None,
        "foto_url": foto_url, "estado": "nueva",
    }
    _insertar("ph_denuncias", fila)
    return jsonify(ok=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=True)

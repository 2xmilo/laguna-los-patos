/* ==========================================================================
   CONFIG · Monitoreo Ciudadano Laguna Los Patos
   Rellenar tras crear el proyecto Supabase y desplegar el backend en Render.
   ========================================================================== */

// Backend Flask que cruza con la DMC y guarda en Supabase.
// En local usa localhost; desplegado (Vercel) usa el backend en Render.
var API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laguna-los-patos.onrender.com';

// Supabase del proyecto Laguna (clave PUBLISHABLE / anon — segura en frontend)
var SUPA_URL = 'https://noqcvqatxzpqbtwdnmgk.supabase.co';
var SUPA_ANON_KEY = 'sb_publishable_Ktgx7rFsqDjXvxiDie0XYQ_LxOgYFY8';

// Bucket de Storage para las fotos de respaldo
var FOTOS_BUCKET = 'lecturas-fotos';

// Ubicación de la laguna (para la galería de biodiversidad iNaturalist)
var LAGUNA_LAT = -39.8098;
var LAGUNA_LON = -73.2560;
var INAT_RADIUS_KM = 5;   // radio de búsqueda de especies alrededor de la laguna

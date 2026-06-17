/* ==========================================================================
   CONFIG · Monitoreo Ciudadano Laguna Los Patos
   Rellenar tras crear el proyecto Supabase y desplegar el backend en Render.
   ========================================================================== */

// Backend Flask (Render) que cruza con la DMC y guarda en Supabase
var API_URL = 'http://localhost:5000';

// Supabase del proyecto Laguna (clave PUBLISHABLE / anon — segura en frontend)
var SUPA_URL = 'https://noqcvqatxzpqbtwdnmgk.supabase.co';
var SUPA_ANON_KEY = 'sb_publishable_Ktgx7rFsqDjXvxiDie0XYQ_LxOgYFY8';

// Bucket de Storage para las fotos de respaldo
var FOTOS_BUCKET = 'lecturas-fotos';

/* ==========================================================================
   CONFIG · Plataforma Digital de Humedales Urbanos — Piloto Isla Teja
   Comparte el proyecto Supabase con monitoreo-ciudadano (tablas ph_*).
   ========================================================================== */

// Backend Flask de la plataforma (IA de especies + denuncias).
// Desplegar aparte del backend de la laguna. Editar la URL tras el deploy.
var PH_API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'https://plataforma-humedales.onrender.com'; // ← editar tras desplegar

// Supabase compartido (misma clave publishable del proyecto laguna)
var PH_SUPA_URL = 'https://noqcvqatxzpqbtwdnmgk.supabase.co';
var PH_SUPA_ANON_KEY = 'sb_publishable_Ktgx7rFsqDjXvxiDie0XYQ_LxOgYFY8';

// Herramienta de monitoreo de nivel de la Laguna de los Patos: ahora vive
// ANIDADA dentro de este mismo deploy (misma URL). Ruta interna relativa.
var MONITOREO_LAGUNA_URL = 'herramientas/laguna-los-patos/monitoreo-nivel/';

// Centro del mapa: intersección Los Robles con Los Lingues (Isla Teja, Valdivia)
var MAPA_CENTRO = [-39.814061, -73.259746];
var MAPA_ZOOM = 15;

// Modo demo: si el backend no responde, los formularios simulan la respuesta
// para poder mostrar el flujo completo sin infraestructura desplegada.
var PH_MODO_DEMO_FALLBACK = true;

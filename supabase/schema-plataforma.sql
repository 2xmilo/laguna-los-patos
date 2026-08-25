-- ============================================================================
-- Esquema Supabase · Plataforma Digital de Humedales Urbanos (piloto Isla Teja)
-- Comparte el proyecto con monitoreo-ciudadano. Tablas prefijadas ph_* para no
-- chocar con lecturas_nivel / datos_meteorologicos.
-- ============================================================================

-- Avistamientos de ciencia ciudadana --------------------------------------
create table if not exists public.ph_avistamientos (
    id                   uuid primary key default gen_random_uuid(),
    creado_en            timestamptz not null default now(),
    humedal_id           text not null,
    lat                  numeric,
    lon                  numeric,
    especie              text,
    confianza            numeric,
    foto_url             text,
    grado_investigacion  boolean not null default false,
    inat_obs_id          bigint
);

-- Denuncias anónimas para el panel municipal ------------------------------
--   Sin user_id ni datos identificatorios: la anonimidad es real.
create table if not exists public.ph_denuncias (
    id           uuid primary key default gen_random_uuid(),
    creado_en    timestamptz not null default now(),
    humedal_id   text not null,
    tipo         text not null default 'otro',
    descripcion  text,
    lat          numeric,
    lon          numeric,
    foto_url     text,
    estado       text not null default 'nueva'   -- nueva | en_gestion | resuelta
);

create index if not exists idx_ph_avist_humedal on public.ph_avistamientos(humedal_id);
create index if not exists idx_ph_avist_creado on public.ph_avistamientos(creado_en);
create index if not exists idx_ph_denun_humedal on public.ph_denuncias(humedal_id);
create index if not exists idx_ph_denun_estado on public.ph_denuncias(estado);

-- ============================================================================
-- Row Level Security
--   · Avistamientos: SELECT público (galería/ciencia). INSERT solo backend.
--   · Denuncias: NADA público. Solo el backend (service_role) y el panel
--     municipal autenticado pueden leerlas.
-- ============================================================================
alter table public.ph_avistamientos enable row level security;
alter table public.ph_denuncias enable row level security;

drop policy if exists "ph_avist_select_publico" on public.ph_avistamientos;
create policy "ph_avist_select_publico"
    on public.ph_avistamientos for select
    to anon using (true);

-- (Sin policy de INSERT para anon en ninguna tabla: el backend usa service_role,
--  que salta RLS. Las denuncias no tienen policy de SELECT para anon a propósito.)

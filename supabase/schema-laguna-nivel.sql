-- ============================================================================
-- Esquema Supabase · Monitoreo Ciudadano Laguna Los Patos
-- Proyecto independiente de Evergreen.
-- ============================================================================

-- Lecturas ciudadanas de nivel (lo único que ingresa la persona) ------------
create table if not exists public.lecturas_nivel (
    id          uuid primary key default gen_random_uuid(),
    creado_en   timestamptz not null default now(),
    nivel_cm    numeric not null,
    foto_url    text,
    id_anonimo  text,
    meteo_ok    boolean not null default false
);

-- Meteo cruzada con Isla Teja + ET calculada (interno, 1:1 con la lectura) ---
create table if not exists public.datos_meteorologicos (
    id                       uuid primary key default gen_random_uuid(),
    lectura_id               uuid not null references public.lecturas_nivel(id) on delete cascade,
    estacion_codigo          text,
    estacion_nombre          text,
    momento_utc              text,
    momento_local            text,
    temperatura_c            numeric,
    humedad_relativa_pct     numeric,
    radiacion_global_w_m2    numeric,
    presion_hpa              numeric,
    precipitacion_minuto_mm  numeric,
    precipitacion_24h_mm     numeric,
    viento_kt                numeric,
    viento_dir_grados        numeric,
    et_priestley_mm_h        numeric,
    creado_en                timestamptz not null default now()
);

create index if not exists idx_meteo_lectura on public.datos_meteorologicos(lectura_id);
create index if not exists idx_lecturas_creado on public.lecturas_nivel(creado_en);

-- ============================================================================
-- Row Level Security
--   · Lectura pública (dashboard anónimo) → SELECT permitido a anon.
--   · Escritura SOLO desde el backend (service_role salta RLS).
-- ============================================================================
alter table public.lecturas_nivel enable row level security;
alter table public.datos_meteorologicos enable row level security;

drop policy if exists "lecturas_select_publico" on public.lecturas_nivel;
create policy "lecturas_select_publico"
    on public.lecturas_nivel for select
    to anon using (true);

drop policy if exists "meteo_select_publico" on public.datos_meteorologicos;
create policy "meteo_select_publico"
    on public.datos_meteorologicos for select
    to anon using (true);

-- (No se crean policies de INSERT para anon: el backend usa service_role.)

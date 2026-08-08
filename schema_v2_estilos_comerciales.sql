-- =====================================================================
-- schema_v2_estilos_comerciales.sql
-- Migración sobre el esquema ACTIVO (schema.sql, plan Antigravity).
-- Revive la tabla estilos_comerciales (que había quedado archivada en
-- backend/supabase/schema_v2.sql cuando se adoptó el plan de Antigravity).
--
-- NO se toca schema.sql. El campo de texto plano `estilo` que ya usan
-- `productos` y `diseños_base` se conserva intacto (así app.js no se
-- rompe) — esta migración SUMA `estilo_id` como columna opcional, no
-- reemplaza nada.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists estilos_comerciales (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(120) not null unique,
  tipo_producto varchar(120),
  descripcion text,
  configuracion_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Columnas opcionales nuevas (nullable, no rompen filas existentes)
alter table productos      add column if not exists estilo_id uuid references estilos_comerciales(id) on delete set null;
alter table diseños_base   add column if not exists estilo_id uuid references estilos_comerciales(id) on delete set null;

create index if not exists idx_productos_estilo_id     on productos(estilo_id);
create index if not exists idx_disenos_base_estilo_id  on diseños_base(estilo_id);

-- ---------------------------------------------------------------------
-- Primer estilo real, definido por Kikyta (no es un dato inventado):
-- "Minimalista comercial + fotografía protagonista"
-- Se ve, por ejemplo, en los carteles reales de verdulería
-- (Cebolla Blanca, Espinaca, Acelga, Jengibre).
-- ---------------------------------------------------------------------
insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Minimalista Comercial',
  'verduleria / producto fresco',
  'Fondo blanco limpio. Mucho espacio negativo. Un solo producto protagonista. ' ||
  'Jerarquia tipografica muy fuerte. Colores tomados del propio alimento. ' ||
  'Precio extremadamente visible. Elementos decorativos minimos (hojas y pinceladas).',
  '{
    "fondo": "blanco_limpio",
    "espacio_negativo": "alto",
    "producto": "protagonista_unico",
    "jerarquia_tipografica": "muy_fuerte",
    "colores": "tomados_del_alimento",
    "precio": "maxima_visibilidad",
    "decoracion": "minima_hojas_y_pinceladas"
  }'::jsonb
)
on conflict (nombre) do nothing;

-- =====================================================================
-- TAREA 002 · Migración inicial a Supabase
-- Reemplaza el guardado de imágenes como BYTEA (backend/schema.sql, viejo)
-- por: Supabase Storage (imágenes) + PostgreSQL (datos y relaciones).
--
-- IMPORTANTE: este archivo NO carga datos de ejemplo. Los productos y
-- marcas se cargan a partir de lo que exista realmente (carteles ya
-- hechos, marcas reales que use Super Fontana), no con datos inventados.
--
-- No se borró ni modificó backend/schema.sql (queda como referencia
-- histórica del diseño anterior).
-- =====================================================================

-- Necesario para generar UUIDs
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- estilos_comerciales
-- Define un "lenguaje visual" reutilizable (colores, tipografías, tono)
-- que después se aplica a una o más plantillas.
-- ---------------------------------------------------------------------
create table if not exists estilos_comerciales (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(120) not null,
  tipo_producto varchar(120),              -- ej: "almacen", "verduleria", "bebidas"
  descripcion text,
  configuracion_json jsonb not null default '{}'::jsonb,  -- colores, fuentes, reglas
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- marcas
-- Marcas reales que vende Super Fontana (Nestlé, La Virginia, etc.)
-- Se carga solo con marcas que existan de verdad en los carteles reales.
-- ---------------------------------------------------------------------
create table if not exists marcas (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(150) not null unique,
  logo_url text,                            -- referencia a Supabase Storage (bucket "logos")
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- plantillas
-- Diseños base (derivados de los carteles reales ya existentes).
-- zonas_json guarda dónde va cada campo editable dentro del diseño
-- (precio, nombre, foto de producto), para que actualizar sea
-- "completar campos" en vez de dibujar un recuadro a mano cada vez.
-- ---------------------------------------------------------------------
create table if not exists plantillas (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(150) not null,
  estilo_id uuid references estilos_comerciales(id) on delete set null,
  imagen_url text,                          -- referencia a Storage (bucket "plantillas")
  zonas_json jsonb not null default '[]'::jsonb,
  -- ejemplo de zonas_json:
  -- [{"campo":"precio","x":60,"y":1100,"w":400,"h":120},
  --  {"campo":"nombre_producto","x":0,"y":80,"w":900,"h":140}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- productos
-- Catálogo de productos reales de Super Fontana (se carga a partir de
-- lo que aparezca en los carteles reales existentes, no inventado).
-- ---------------------------------------------------------------------
create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid references marcas(id) on delete set null,
  nombre varchar(200) not null,
  imagen_url text,                          -- referencia a Storage (bucket "productos")
  categoria varchar(60),                    -- una de las 6 categorias ya definidas
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- carteles_generados
-- Cada cartel final producido por el sistema: qué plantilla + qué
-- producto + qué precio se usó, y el resultado final.
-- Sirve como historial (no se pisa un cartel anterior, se genera uno nuevo).
-- ---------------------------------------------------------------------
create table if not exists carteles_generados (
  id uuid primary key default gen_random_uuid(),
  plantilla_id uuid references plantillas(id) on delete set null,
  producto_id uuid references productos(id) on delete set null,
  precio numeric(12,2),
  imagen_final_url text,                    -- referencia a Storage (bucket "finales")
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices para las búsquedas más comunes
-- ---------------------------------------------------------------------
create index if not exists idx_plantillas_estilo on plantillas(estilo_id);
create index if not exists idx_productos_marca on productos(marca_id);
create index if not exists idx_productos_categoria on productos(categoria);
create index if not exists idx_carteles_generados_plantilla on carteles_generados(plantilla_id);
create index if not exists idx_carteles_generados_producto on carteles_generados(producto_id);

-- ---------------------------------------------------------------------
-- NOTA sobre Row Level Security (RLS)
-- Todavía no se definió la estrategia de Auth (quién puede escribir/leer).
-- Por eso RLS queda sin activar en esta migración inicial, a propósito.
-- Antes de exponer esto en internet para varios empleados, hay que:
--   1) decidir el modelo de Auth (Supabase Auth con roles, o similar)
--   2) activar RLS en cada tabla con "alter table X enable row level security;"
--   3) escribir las políticas (quién puede SELECT/INSERT/UPDATE/DELETE)
-- =====================================================================

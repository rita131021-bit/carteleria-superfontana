-- =====================================================================
-- schema_v2.sql · Sistema Inteligente de Diseño Comercial · Super Fontana
--
-- Reemplaza a backend/supabase/schema.sql (v1) como la versión vigente.
-- NO se tocó: backend/schema.sql, backend/server.js, backend/seed.js
-- (siguen intactos, arquitectura vieja, hasta el paso de conexión).
--
-- Sin datos de ejemplo. Sin RLS activado todavía (pendiente de decidir
-- el modelo de Auth antes de exponer esto en internet).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- estilos_comerciales
-- La memoria de diseño: un "lenguaje visual" reutilizable.
-- Ej: "vino elegante", "oferta góndola", "verdulería fresca", "limpieza hogar"
-- ---------------------------------------------------------------------
create table if not exists estilos_comerciales (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(120) not null,
  tipo_producto varchar(120),
  descripcion text,
  configuracion_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- marcas
-- ---------------------------------------------------------------------
create table if not exists marcas (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(150) not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- plantillas
-- Diseños base = referencias visuales, no carteles finales rígidos.
-- zonas_editables_json define dónde va cada campo dentro del diseño.
-- ---------------------------------------------------------------------
create table if not exists plantillas (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(150) not null,
  estilo_id uuid references estilos_comerciales(id) on delete set null,
  imagen_url text,
  zonas_editables_json jsonb not null default '{}'::jsonb,
  -- ejemplo:
  -- {
  --   "precio":  {"x":700,"y":850},
  --   "imagen":  {"posicion":"centro"},
  --   "texto":   {"posicion":"inferior"}
  -- }
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- productos
-- ---------------------------------------------------------------------
create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid references marcas(id) on delete set null,
  nombre varchar(200) not null,
  imagen_url text,
  descripcion text,
  categoria varchar(60),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- carteles_generados
-- ---------------------------------------------------------------------
create table if not exists carteles_generados (
  id uuid primary key default gen_random_uuid(),
  plantilla_id uuid references plantillas(id) on delete set null,
  producto_id uuid references productos(id) on delete set null,
  precio numeric(12,2),
  imagen_final_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- recursos_diseño
-- Tabla nueva (no estaba en schema.sql v1). Guarda elementos gráficos
-- sueltos que se reutilizan ENTRE plantillas: fondos, texturas, sellos
-- de oferta, íconos. Evita duplicar estos elementos adentro de cada
-- plantilla o meterlos como si fueran parte de un producto.
-- ---------------------------------------------------------------------
create table if not exists recursos_diseno (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(150) not null,
  tipo varchar(60) not null,   -- ej: 'fondo', 'textura', 'sello_oferta', 'icono'
  archivo_url text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists idx_plantillas_estilo on plantillas(estilo_id);
create index if not exists idx_productos_marca on productos(marca_id);
create index if not exists idx_productos_categoria on productos(categoria);
create index if not exists idx_carteles_generados_plantilla on carteles_generados(plantilla_id);
create index if not exists idx_carteles_generados_producto on carteles_generados(producto_id);
create index if not exists idx_recursos_diseno_tipo on recursos_diseno(tipo);

-- =====================================================================
-- PLAN DE STORAGE (a crear manualmente en el panel de Supabase)
--
-- Un solo bucket "super-fontana", con carpetas (paths) adentro:
--
--   super-fontana/
--   ├── plantillas/         (imagen_url de la tabla plantillas)
--   ├── marcas/              (logo_url de la tabla marcas)
--   ├── productos/            (imagen_url de la tabla productos)
--   ├── carteles-finales/     (imagen_final_url de carteles_generados)
--   └── recursos/             (archivo_url de recursos_diseno)
--
-- Nota: Supabase Storage no anida buckets entre sí, pero sí permite
-- carpetas dentro de un mismo bucket (que es lo que se usa acá) o,
-- alternativamente, 5 buckets separados si se prefiere aislar permisos
-- por tipo de archivo más adelante. Se deja como bucket único + carpetas
-- por ser más simple de administrar mientras no haya Auth con roles.
-- =====================================================================

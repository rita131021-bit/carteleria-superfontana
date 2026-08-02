-- =====================================================================
-- schema_v3.sql · ADN comercial de cada diseño · Super Fontana
--
-- Suma a lo que ya existe en schema_v2.sql (no lo reemplaza ni lo toca).
-- NO se tocó: backend/schema.sql, backend/server.js, backend/seed.js,
-- backend/supabase/schema.sql (v1), backend/supabase/schema_v2.sql.
--
-- Solo estructura. Sin datos cargados (ni "premium", ni "fresco", ni
-- ningún atributo de ejemplo) — se cargan en un paso aparte, cuando se
-- definan los atributos reales que va a usar Super Fontana.
-- =====================================================================

-- ---------------------------------------------------------------------
-- atributos_diseno
-- El "ADN comercial": etiquetas que describen la sensación/función de
-- un diseño (premium, fresco, económico, mayorista, impulso, familia,
-- ahorro, natural, etc.)
--
-- Se usan "nombre" + "valor" en vez de una sola palabra suelta, para
-- poder agrupar atributos del mismo tipo más adelante. Ejemplo:
--   nombre='tono_comercial'   valor='premium'
--   nombre='tono_comercial'   valor='economico'
--   nombre='publico_objetivo' valor='familia'
--   nombre='publico_objetivo' valor='impulso'
-- Si en la práctica no hace falta esa agrupación, "nombre" y "valor"
-- pueden terminar siendo iguales (ej. nombre='fresco' valor='fresco') —
-- la estructura no obliga a usar la agrupación, solo la deja disponible.
-- ---------------------------------------------------------------------
create table if not exists atributos_diseno (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(100) not null,
  valor varchar(100) not null,
  created_at timestamptz not null default now(),
  unique (nombre, valor)
);

-- ---------------------------------------------------------------------
-- estilos_atributos
-- Relación muchos-a-muchos: un estilo puede tener varios atributos
-- (ej. "vino premium" = elegante + alto_impacto + minimalista), y un
-- mismo atributo puede aplicar a varios estilos distintos.
-- ---------------------------------------------------------------------
create table if not exists estilos_atributos (
  estilo_id uuid not null references estilos_comerciales(id) on delete cascade,
  atributo_id uuid not null references atributos_diseno(id) on delete cascade,
  primary key (estilo_id, atributo_id)
);

create index if not exists idx_estilos_atributos_estilo on estilos_atributos(estilo_id);
create index if not exists idx_estilos_atributos_atributo on estilos_atributos(atributo_id);

-- =====================================================================
-- Con esto, una consulta como "qué estilos son premium" queda así:
--
-- select ec.*
-- from estilos_comerciales ec
-- join estilos_atributos ea on ea.estilo_id = ec.id
-- join atributos_diseno ad on ad.id = ea.atributo_id
-- where ad.valor = 'premium';
-- =====================================================================

-- =========================================================================
-- ESQUEMA DE BASE DE DATOS - SUPER FONTANA DESIGNER
-- Pegar este script en el editor SQL de Supabase (SQL Editor -> New Query)
-- =========================================================================

-- Habilitar extensión para UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: Marcas
CREATE TABLE IF NOT EXISTS marcas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT, -- URL pública del logo en el bucket de storage 'logos'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: Productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  imagen_url TEXT, -- URL de la foto en el bucket de storage 'productos'
  categoria VARCHAR(60) NOT NULL, -- Bebidas, Limpieza, Verdulería, Almacén, Lácteos, Fiambrería
  estilo VARCHAR(60) NOT NULL, -- Elegante, Fresco, Familiar, Confianza, Diario
  marca_id UUID REFERENCES marcas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: Diseños Base (Plantillas de los 63 carteles)
CREATE TABLE IF NOT EXISTS diseños_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  imagen_url TEXT NOT NULL, -- URL de la plantilla en el bucket 'diseños'
  categoria_cartel VARCHAR(60) NOT NULL, -- 01_marcas, 02_gondola_producto, 03_precio_mayorista, 04_variedades_mismo_precio, 05_sin_imagen_solo_texto, 06_logo_plantilla
  estilo VARCHAR(60) NOT NULL, -- Elegante, Fresco, Familiar, Confianza, General
  config_parches JSONB DEFAULT '{}'::jsonb, -- Coordenadas y estilos de placeholders (precio, nombre, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA: Carteles Generados (Historial para imprimir)
CREATE TABLE IF NOT EXISTS carteles_generados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  diseño_base_id UUID REFERENCES diseños_base(id) ON DELETE SET NULL,
  precio VARCHAR(50) NOT NULL,
  imagen_url TEXT NOT NULL, -- URL del cartel final en el bucket 'generados'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para optimización de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_diseños_categoria ON diseños_base(categoria_cartel);
CREATE INDEX IF NOT EXISTS idx_diseños_estilo ON diseños_base(estilo);

-- =========================================================================
-- CONFIGURACIÓN DE STORAGE BUCKETS (ALMACENAMIENTO DE IMÁGENES)
-- =========================================================================

-- Crear buckets si no existen
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('logos', 'logos', true),
  ('productos', 'productos', true),
  ('diseños', 'diseños', true),
  ('generados', 'generados', true),
  ('identidad', 'identidad', true)
ON CONFLICT (id) DO NOTHING;

-- Nota: Para que el cliente frontend pueda subir imágenes directamente sin 
-- iniciar sesión (en un entorno controlado de red interna), asegúrate de que
-- los buckets tengan habilitadas las políticas de acceso público de lectura y escritura.
--
-- Puedes habilitar las políticas de forma manual en el panel de Supabase (Storage -> Policies)
-- o pegar los siguientes comandos si tienes permisos administrativos sobre storage:

-- Habilitar políticas públicas rápidas para insertar y leer
-- (Reemplazar por políticas más restrictivas con Auth de ser necesario)
CREATE POLICY "Acceso público lectura logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Acceso público escritura logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Acceso público lectura productos" ON storage.objects FOR SELECT USING (bucket_id = 'productos');
CREATE POLICY "Acceso público escritura productos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'productos');

CREATE POLICY "Acceso público lectura diseños" ON storage.objects FOR SELECT USING (bucket_id = 'diseños');
CREATE POLICY "Acceso público escritura diseños" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'diseños');

CREATE POLICY "Acceso público lectura generados" ON storage.objects FOR SELECT USING (bucket_id = 'generados');
CREATE POLICY "Acceso público escritura generados" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generados');

CREATE POLICY "Acceso público lectura identidad" ON storage.objects FOR SELECT USING (bucket_id = 'identidad');
CREATE POLICY "Acceso público escritura identidad" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'identidad');

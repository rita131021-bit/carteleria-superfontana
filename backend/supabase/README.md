# Migración inicial a Supabase

## Cómo aplicar este esquema
1. Crear un proyecto en https://supabase.com (plan gratuito para arrancar).
2. En el panel de Supabase → **SQL Editor** → pegar el contenido de `schema.sql` → Run.
3. En **Storage**, crear 4 buckets (nombres exactos, en minúscula):
   - `logos`
   - `productos`
   - `plantillas`
   - `finales`

## Qué NO incluye todavía esta migración (a propósito)
- Datos de ejemplo / productos inventados — se cargan después, a partir de
  los carteles y marcas reales de Super Fontana.
- Políticas de Row Level Security (RLS) — pendiente de decidir el modelo de Auth.
- Conexión desde `server.js` (backend/server.js sigue apuntando al esquema viejo
  por ahora — la conexión a Supabase se suma en un paso posterior, sin borrar
  lo anterior hasta confirmar que la migración de datos salió bien).

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
- Frontend/panel que consuma estos datos — todavía no existe.

## Conexión inicial (solo lectura) — `client.js` + `server.js`

Una vez que exista el proyecto Supabase real y se hayan corrido las 3 migraciones
(`schema.sql`, `schema_v2.sql`, `schema_v3.sql`):

1. Copiar `.env.example` a `.env` dentro de esta carpeta (`backend/supabase/.env`)
   y completar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Panel Supabase →
   Project Settings → API).
2. Adentro de `backend/supabase/`:
   ```
   npm install
   npm start
   ```
3. Va a levantar en `http://localhost:4000` (o el puerto que pongas en
   `SUPABASE_BACKEND_PORT`), con estos endpoints de solo lectura:
   - `GET /api/estilos-comerciales`
   - `GET /api/marcas`
   - `GET /api/plantillas`
   - `GET /api/productos`
   - `GET /api/carteles-generados`
   - `GET /api/atributos-diseno`
   - `GET /api/estilos-comerciales/:id/atributos` (atributos de un estilo puntual)

Este backend es **independiente** del backend viejo (`backend/server.js`, que
sigue usando PostgreSQL con `BYTEA` sin ningún cambio). Corren en puertos
distintos y no comparten código. Todavía no hay ningún frontend que consuma
estos endpoints — se agregan cuando haga falta un panel real.


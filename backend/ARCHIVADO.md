# ⚠️ Carpeta archivada / histórica

Todo lo que está dentro de `backend/` (el backend Node.js viejo con `BYTEA`,
y las migraciones `backend/supabase/schema.sql`, `schema_v2.sql`, `schema_v3.sql`
con el modelo `estilos_comerciales` + `atributos_diseno`) **quedó reemplazado**
por la nueva app en la raíz del repo:

- `index.html` + `app.js` + `config.js` + `style.css` → la aplicación (SPA)
- `schema.sql` (raíz) → el esquema de Supabase vigente
- `seed_supabase.ps1` → el script de carga inicial vigente

Se decidió (2026-08-03) usar el esquema más simple de Antigravity
(`productos.estilo` y `diseños_base.estilo` como texto plano) en vez del
modelo normalizado con `estilos_comerciales`/`atributos_diseno` que se había
diseñado acá.

**No se borra esta carpeta** — queda como referencia histórica de decisiones
de diseño anteriores, por si en algún momento se retoma esa idea del modelo
normalizado (por ejemplo, si más adelante hace falta filtrar productos por
combinaciones de atributos).

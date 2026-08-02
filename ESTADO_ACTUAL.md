# Estado Actual · Cartelería Super Fontana

_Última actualización: checkpoint tras schema_v3.sql (atributos_diseño)._

## Repo
`github.com/rita131021-bit/carteleria-superfontana` — público.

## Qué existe hoy en el repo

```
carteleria-superfontana/
├── DIAGNOSTICO_BACKEND.md          → análisis del backend viejo (no tocar)
├── RESUMEN_PROYECTO.md             → contexto general del proyecto (desactualizado
│                                      en la parte de "referencias/", esa carpeta
│                                      ya no existe en el repo)
├── logo_super_fontana.jpg          → logo real del cliente
│
└── backend/
    ├── server.js, schema.sql, seed.js, package.json, README.md, .env.example
    │     → ARQUITECTURA VIEJA (biblioteca simple, imágenes en BYTEA).
    │       Sigue intacta. Todavía no está conectada a nada nuevo.
    │       No se desplegó nunca en Railway.
    │
    └── supabase/
        ├── schema.sql      → v1: primeras 5 tablas (borrador inicial)
        ├── schema_v2.sql   → v2: mismas 5 tablas + tabla recursos_diseño
        │                      + plan de buckets de Storage
        ├── schema_v3.sql   → v3: suma atributos_diseno + relación
        │                      muchos-a-muchos con estilos_comerciales
        └── README.md       → pasos para crear el proyecto Supabase y los buckets
```

## Qué NO existe todavía (importante para no asumir de más)

- **Ningún proyecto Supabase real creado.** Todo lo de `backend/supabase/` son
  archivos `.sql` locales en el repo — nadie los corrió contra una base de
  datos real todavía.
- **Ningún dato cargado.** Cero marcas, productos, estilos o atributos
  inventados o reales. Las tablas, si se crearan hoy, quedarían vacías.
- **Ningún bucket de Storage creado.** El plan está documentado como
  comentario en `schema_v2.sql`, pero no se ejecutó en ningún panel de Supabase.
- **`server.js` no habla con Supabase.** Sigue conectado únicamente al
  esquema viejo (`backend/schema.sql`, PostgreSQL con `BYTEA`).
- **No hay backend desplegado en ningún lado** (ni Railway ni otro). Todo
  vive como código en el repo, sin correr en un servidor real.
- **No hay panel de administración todavía** (cargar logo, foto, precio,
  elegir estilo, generar cartel) — es el próximo módulo funcional planeado,
  pero no arrancado.

## Orden de las migraciones SQL (para cuando se cree el proyecto Supabase)
1. `backend/supabase/schema.sql`
2. `backend/supabase/schema_v2.sql`
3. `backend/supabase/schema_v3.sql`

Cada una es aditiva (usa `create table if not exists`), así que correrlas en
ese orden no debería fallar ni duplicar nada.

## Próximo paso acordado
Crear el proyecto Supabase real, correr las 3 migraciones, crear los buckets.
Recién después: conectar `server.js` (o un backend nuevo) a Supabase — sin
tocar la arquitectura vieja hasta confirmar que la nueva funciona.

## Nota
`RESUMEN_PROYECTO.md` quedó desactualizado en la sección de arquitectura
(todavía describe `referencias/`, `biblioteca.html`, etc., que ya no están en
el repo). Se deja así a propósito por ahora — no se prioriza actualizar
documentación mientras se sigue construyendo la base. Este archivo
(`ESTADO_ACTUAL.md`) es la fuente de verdad más reciente.

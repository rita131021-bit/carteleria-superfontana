# Estado Actual · Cartelería Super Fontana

_Última actualización: adopción del plan de Antigravity (SPA + Supabase directo)._

## ⚠️ Cambio de arquitectura (2026-08-03)

Se reemplazó el enfoque anterior (backend Node.js propio + modelo normalizado
`estilos_comerciales`/`atributos_diseno`) por el plan de Antigravity:

- **Sin backend intermedio**: la app (`index.html` + `app.js`) habla directo
  con Supabase desde el navegador, usando el cliente JS de Supabase.
- **Esquema más simple**: `schema.sql` (raíz) con `marcas`, `productos`,
  `diseños_base`, `carteles_generados` — el "estilo" queda como texto plano
  (`"Elegante"`, `"Fresco"`, etc.), no como tabla relacionada.
- **Carga inicial en PowerShell**: `seed_supabase.ps1`, pensado para correr
  desde Windows, sube los 63 carteles de `referencias/` a Supabase Storage.
- **Todo lo anterior queda archivado en `backend/`** (ver `backend/ARCHIVADO.md`),
  sin borrar, por si hace falta retomarlo.

## Repo
`github.com/rita131021-bit/carteleria-superfontana` — público.

## Qué existe hoy en el repo

```
carteleria-superfontana/
├── index.html, app.js, config.js, style.css   → LA APP (SPA), activa
├── schema.sql                                  → esquema Supabase vigente
├── seed_supabase.ps1                           → carga inicial (Windows/PowerShell)
├── referencias/                                → 63 carteles reales, clasificados
├── logo_super_fontana.jpg
├── DIAGNOSTICO_BACKEND.md, RESUMEN_PROYECTO.md, PROPUESTA_MIGRACION_SUPABASE.md
│     → documentación de decisiones anteriores (contexto histórico)
└── backend/            → ARCHIVADO, ver backend/ARCHIVADO.md
```

## Qué NO existe todavía

- **Ningún proyecto Supabase real creado.** `schema.sql` y `seed_supabase.ps1`
  están listos pero no se ejecutaron contra ninguna base real todavía.
- **Ningún dato cargado.** Cero marcas, productos o diseños reales en la base.
- **Sin autenticación/login.** Las políticas de Storage quedan con escritura
  pública (decisión tomada: "dejarlo así por ahora, uso interno, la URL no es
  pública todavía") — revisar esto antes de compartir la URL de la app afuera
  del equipo.
- **La app todavía no se probó conectada a un Supabase real** — el próximo
  paso es justamente ese.

## Próximo paso acordado
1. Crear el proyecto real en Supabase.
2. Correr `schema.sql` en el SQL Editor de Supabase.
3. Correr `seed_supabase.ps1` desde Windows para cargar los 63 carteles.
4. Pegar la URL y la Anon Key en la pestaña "Configuración" de la app
   (`index.html`) para conectar todo.

## Nota
Este archivo es la fuente de verdad más reciente. `RESUMEN_PROYECTO.md` y
`DIAGNOSTICO_BACKEND.md` describen la arquitectura **anterior** (Node.js +
modelo normalizado) — se dejan como contexto histórico, no como estado actual.

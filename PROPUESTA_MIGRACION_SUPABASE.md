# Propuesta: Migración del Backend a Supabase

**No se modificó ningún archivo.** Esto es un análisis y una propuesta para decidir
en conjunto con Codex antes de tocar código.

---

## 1. Qué es Supabase, en una línea

Un servicio que da, todo junto y ya integrado: una base de datos PostgreSQL real,
un sistema de login/usuarios (Auth), un almacenamiento de archivos tipo "carpeta en
la nube" (Storage), y una API REST que se genera **sola** a partir de las tablas,
sin tener que escribir cada endpoint a mano.

## 2. Backend actual vs. lo que ofrece Supabase

| Pieza | Hoy (`backend/`) | Con Supabase |
|---|---|---|
| Base de datos | PostgreSQL en Railway, gestionada a mano | PostgreSQL gestionada por Supabase (mismo motor, mismo SQL) |
| Guardado de imágenes | Adentro de la tabla, como `bytea` (el archivo entero metido en una columna) | En **Supabase Storage** (un bucket de archivos), la tabla solo guarda la URL/ruta |
| Endpoints (listar, subir, editar, borrar) | Escritos a mano en `server.js` con Express | Se generan **automáticamente** por Supabase a partir de la tabla (API REST y también SDK en JS) |
| Login/permisos | No existe | Supabase Auth + reglas de seguridad por tabla (RLS), declarativas, sin código de login a mano |
| Subida de archivos | `multer` + lógica manual en el endpoint | SDK de Supabase Storage, ya resuelto |
| Servidor propio (Express corriendo 24/7) | Necesario | Opcional — para CRUD simple ni siquiera hace falta un backend propio, el frontend puede hablar directo con Supabase (con las reglas de seguridad puestas correctamente) |

## 3. Qué se conserva

- **El modelo de datos conceptual**: las 6 categorías, el campo "nombre", la idea
  de guardar carteles clasificados — eso se traduce directo a una tabla de Supabase,
  no se pierde ni se rediseña de cero.
- **La lógica de `seed.js`**: la idea de cargar en bloque los carteles existentes
  sigue siendo válida, solo cambia la herramienta (en vez de un `INSERT` a mano,
  se usa el cliente de Supabase para subir a Storage + insertar la fila).
- **Railway no se descarta necesariamente**: si en el futuro hace falta lógica
  de negocio custom (por ejemplo, procesar una imagen, mandar un mail, correr un
  cálculo), eso puede seguir viviendo en un backend chico en Railway que le hable
  a Supabase — no es todo o nada.

## 4. Qué se reemplaza

- **`schema.sql` con `imagen BYTEA`** → se reemplaza por una tabla sin el binario:
  la imagen se sube a un bucket de Storage y la tabla solo guarda la URL. Esto es
  una mejora real, no solo un cambio de proveedor: guardar imágenes pesadas
  adentro de PostgreSQL (`bytea`) no es una práctica recomendada — hace la base
  de datos más lenta y pesada de respaldar. Storage está pensado justo para esto.
- **Los endpoints de `server.js`** (GET/POST/PUT/DELETE escritos a mano) →
  se reemplazan por la API automática de Supabase, salvo que quede alguna lógica
  realmente custom que no encaje en un CRUD simple (eso sí seguiría necesitando
  código propio).
- **La ausencia de login** → se reemplaza por Supabase Auth, algo que hoy no
  existe y en algún momento va a hacer falta si el panel queda accesible por
  internet para varios empleados.

## 5. Puntos a tener en cuenta antes de decidir (no son objeciones, son datos)

- Supabase también tiene **plan gratuito**, con límites (por ejemplo, un tope de
  espacio en base de datos y en Storage) — hay que confirmar que el volumen de
  carteles entra cómodo ahí, igual que se chequeó con Railway.
- Pasar de "guardar el binario en la tabla" a "guardar en Storage y solo la URL"
  es la parte más importante del cambio, y conviene decidirla **antes** de cargar
  carteles nuevos, para no tener que migrar datos ya cargados después.
- Si se van a implementar las mejoras del diagnóstico anterior (productos,
  plantillas, zonas editables, historial de precios), Supabase no cambia esa
  necesidad — sigue haciendo falta diseñar esas tablas. Lo que cambia es la
  herramienta con la que se construyen y se sirven.

## 6. Pregunta para resolver antes de migrar

¿La razón para pasar a Supabase es track de **costo/simplicidad** (menos código
propio que mantener), o es porque se necesita **Auth y Storage** en serio para el
sistema inteligente que se planea? La respuesta cambia cuánto del `server.js`
actual conviene tirar y cuánto conviene dejar como capa de lógica custom sobre
Supabase.

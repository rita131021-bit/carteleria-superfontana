# Proyecto: Sistema de Cartelería · Super Fontana

## Objetivo
Reemplazar el uso manual de ChatGPT (lento, se agotan los tokens) para generar
cartelería de supermercado (ofertas, promos, precios) por un sistema propio que:
1. Guarda los carteles reales que ya se hicieron con ChatGPT como base de datos.
2. Permite reutilizarlos editando solo el precio/texto (sin regenerar el diseño de cero).
3. Deja subir carteles nuevos a futuro, ya clasificados.

**Principio central: los carteles que se usan en producción son SIEMPRE imágenes reales
(hechas en ChatGPT), nunca recreaciones por código.** El editor solo superpone un
"parche" (recuadro + texto) sobre la imagen original para actualizar precio/dato,
manteniendo el diseño exacto intacto.

## Cliente
Super Fontana ("El Gigante de Calle Churruarín"), supermercado en Paraná, Entre Ríos.
Logo: T-Rex sobre fondo negro, círculo amarillo, texto "SUPER FONTANA".

## Clasificación de carteles (6 categorías)
1. **01_marcas** — cartel institucional de una marca completa (ej. "Productos Nestlé"), sin precio.
2. **02_gondola_producto** — imagen del producto + nombre + precio + descripción (la categoría más grande, ~42 carteles).
3. **03_precio_mayorista** — "Llevando X unidades, te queda a $X la unidad".
4. **04_variedades_mismo_precio** — mismo producto en 2+ variantes/sabores, un solo precio para todas.
5. **05_sin_imagen_solo_texto** — solo texto: nombre + formato + precio, sin foto de producto.
6. **06_logo_plantilla** — el logo de Super Fontana, se inserta chico abajo en todos los carteles.

Estado actual: **63 carteles reales ya clasificados** en estas 6 carpetas (dentro de `referencias/`).

## Arquitectura (mismo patrón que el proyecto Zen Spa, cliente distinto)

```
backend/          → Node.js + Express + PostgreSQL, deploy en Railway
  server.js       → API REST (listar, subir, editar, borrar carteles)
  schema.sql      → tabla "carteles" (id, categoria, nombre, mime_type, imagen [bytea], created_at)
  seed.js         → script para cargar los 63 carteles existentes de una sola vez
  package.json, .env.example, README.md

referencias/       → los 63 carteles reales, organizados en las 6 carpetas de arriba
style_guide.json   → paleta de colores y estructura visual extraída de los carteles (referencia de diseño)
logo_super_fontana.jpg → logo en alta calidad

biblioteca.html    → panel principal: conecta al backend, muestra los carteles en grilla
                      filtrable por categoría, permite subir nuevos y editar los existentes
                      (requiere cambiar la constante API_URL por la URL de Railway)
editor.html         → misma herramienta de edición pero standalone (sin backend, subiendo
                      el archivo a mano) — útil para probar sin desplegar nada
generador.html      → generador con Canvas/JS puro, 4 estilos (Dinámico, Creativa, Combo, Clásico)
                      — es un boceteador rápido, NO se usa para el cartel final
```

## API del backend (server.js)
- `GET /api/carteles?categoria=X` — lista carteles (metadata, sin la imagen pesada)
- `GET /api/carteles/:id/imagen` — devuelve la imagen binaria de un cartel
- `POST /api/carteles` (form-data: imagen, categoria, nombre) — sube un cartel nuevo
- `PUT /api/carteles/:id` (form-data: imagen) — reemplaza la imagen (guardar edición)
- `DELETE /api/carteles/:id` — borra un cartel

## Flujo de trabajo pensado para el día a día
- **Cartel que ya existe, cambia el precio/oferta:** abrir desde `biblioteca.html` →
  el editor carga la imagen real → agregar un "parche" (recuadro de color + texto)
  tapando el precio viejo → escribir el precio nuevo → "Guardar cambios" (PUT al backend,
  reemplaza la imagen) o "Descargar PNG".
- **Producto nuevo sin cartel previo:** elegir el cartel más parecido de la misma
  categoría como base, y parchar nombre + precio + foto del producto.
- **Diseño realmente nuevo desde cero (raro):** ahí sí se sigue usando ChatGPT
  manualmente, y el resultado se sube a la biblioteca con `POST /api/carteles`
  para que quede disponible como base a futuro.

## Pendiente / próximos pasos
1. Desplegar `backend/` en Railway (repo GitHub → Railway → agregar servicio PostgreSQL
   → Railway conecta `DATABASE_URL` solo).
2. Correr `node seed.js https://TU-URL-DE-RAILWAY.up.railway.app` para cargar los 63
   carteles existentes a la base de datos.
3. Editar la constante `API_URL` en `biblioteca.html` con la URL real de Railway.
4. (Opcional, backlog) Guardar más de un "parche" prearmado por categoría, para no
   tener que reposicionar el recuadro de precio cada vez.
5. (Opcional, backlog) Login/contraseña simple en el backend, si el panel va a quedar
   accesible por internet para varios empleados.

## Notas técnicas para quien continúe el desarrollo
- El único "look creativo" generado por código (no por IA) vive en `generador.html`
  y es intencionalmente secundario — no reemplaza a las imágenes reales.
- No se usa ninguna IA generadora de imágenes conectada al sistema (se descartó por
  costo); todo el "estilo creativo" viene de reusar los carteles reales de ChatGPT.
- Las imágenes se guardan como `bytea` directo en PostgreSQL (no en un bucket aparte)
  porque el volumen es chico (decenas/cientos de carteles, no miles).

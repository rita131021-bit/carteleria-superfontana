# Diagnóstico del Backend Actual · Cartelería Super Fontana

**No se modificó ningún archivo.** Este documento solo analiza el estado real de
`server.js`, `schema.sql` y `seed.js` tal como están en el repo, y qué habría que
sumar/cambiar para pasar de "biblioteca de imágenes" a un sistema inteligente de
diseño comercial.

---

## 1. Qué es el backend HOY (biblioteca simple)

### `schema.sql`
```sql
CREATE TABLE carteles (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(60) NOT NULL,
  nombre VARCHAR(200) DEFAULT '',
  mime_type VARCHAR(50) DEFAULT 'image/png',
  imagen BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```
Una sola tabla. Guarda la **imagen completa como blob binario** y apenas 3 datos
sueltos: categoría (una de 6 fijas), nombre (texto libre, muchas veces vacío o solo
el nombre del archivo) y fecha. **No hay ningún dato estructurado sobre el
contenido del cartel**: no sabe qué producto es, qué precio tiene, qué marca,
qué colores usa, ni si esa imagen es una versión editada de otra.

### `server.js`
Sirve un CRUD mínimo sobre esa tabla:
- `GET /api/carteles` — listar (filtra solo por categoría)
- `GET /api/carteles/:id/imagen` — devolver el binario
- `POST /api/carteles` — subir uno nuevo
- `PUT /api/carteles/:id` — **reemplaza el binario completo**, no hay versionado
- `DELETE /api/carteles/:id`

No hay: autenticación, búsqueda por texto/producto, relación entre carteles
(ej. "este es la versión anterior de aquel"), ni ninguna lógica de negocio —
es un guardado/lectura de archivos con un filtro, nada más.

### `seed.js`
Recorre las 6 carpetas de `referencias/` y sube cada imagen tal cual, usando el
**nombre del archivo como único dato** (`cartel_014.png`, sin info real del
producto). No extrae ni pide ningún metadato adicional al cargar.

**Conclusión del estado actual:** es un "álbum de fotos con 6 etiquetas", no un
sistema que entienda qué hay dentro de cada cartel. Cumple bien su función actual
(guardar y reutilizar imágenes reales para editarlas a mano), pero no tiene
ninguna base para automatizar decisiones de diseño.

---

## 2. Qué le falta para ser un "sistema inteligente de diseño comercial"

Un sistema así necesita, como mínimo, tres capas que hoy no existen:

### A) Datos estructurados del contenido (no solo la imagen)
Hoy la única forma de saber qué dice un cartel es abrirlo y mirarlo. Haría falta
una tabla de **productos/campos** separada de la imagen:

- producto (texto), marca (texto), precio actual (numérico), formato/gramaje,
  fecha de vigencia de la promo, tipo de promo (2x1, mayorista, %, etc.)
- posición y tamaño de cada elemento dentro del cartel (dónde está el precio,
  dónde el nombre) — esto es lo que permitiría editar un precio **sin que un
  humano tenga que arrastrar el recuadro cada vez**, porque el sistema ya
  sabría dónde va.
- relación con la categoría de diseño (las 6 actuales), pero también con un
  **"template_id"** que identifique qué estructura visual comparte con otros
  carteles parecidos.

### B) Historial y versionado
Hoy `PUT` **pisa la imagen anterior para siempre** — no queda registro de qué precio
tenía antes, ni de cuándo cambió. Un sistema comercial necesita:
- Historial de precios por producto (para reportes, para no repetir trabajo si
  vuelve una promo vieja).
- Versionado de la imagen (guardar la anterior, no solo la actual).

### C) Capa de "inteligencia" (la parte que hoy no existe en absoluto)
Para que el sistema *sugiera* o *arme* diseños en vez de solo guardarlos, hace falta:
- Relacionar cada producto con su categoría de diseño automáticamente (hoy es manual).
- Guardar las coordenadas de las zonas editables (precio, nombre, imagen del
  producto) por plantilla, para que actualizar sea "completar campos", no
  "dibujar un recuadro a mano" como hace `editor.html` hoy.
- Un catálogo de productos reutilizable (para no tener que escribir "Coca-Cola
  1.5L" de cero cada vez que se genera un cartel de ese producto).

---

## 3. Cambios concretos que habría que evaluar (para decidir, no para aplicar)

| Área | Estado actual | Cambio necesario |
|---|---|---|
| Esquema de datos | 1 tabla, campos sueltos | Separar en `productos`, `carteles`, `plantillas`, `historial_precios` |
| Zonas editables | No existen (se dibujan a mano en el editor) | Guardar coordenadas por plantilla (x, y, ancho, alto de cada campo) |
| Versionado | `PUT` pisa la imagen | Tabla de versiones o columna `version` + `cartel_padre_id` |
| Búsqueda | Solo por categoría | Por producto, marca, rango de precio, fecha |
| Autenticación | No hay | Necesaria si el panel queda expuesto en internet para varios empleados |
| Metadatos al cargar (`seed.js`) | Solo nombre de archivo | Pedir/completar producto, marca y precio al momento de subir |

---

## 4. Siguiente paso sugerido (para decidir en conjunto, no para ejecutar ya)

Antes de tocar código, definir: **¿el objetivo inmediato es que el sistema
"sepa" qué precio tiene cada cartel (paso B), o que directamente arme carteles
nuevos combinando plantilla + datos de producto (paso C)?** Son dos alcances
distintos y conviene resolver el primero antes de meterse con el segundo, porque
el segundo depende de tener el primero funcionando bien.

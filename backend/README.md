# Backend Cartelería Super Fontana

Guarda todos los carteles clasificados en una base de datos PostgreSQL, y los sirve
por API para que el panel web pueda listarlos, mostrarlos y personalizarlos.

## 1. Desplegar en Railway (mismo flujo que ya usaste con Zen Spa)

1. Creá un proyecto nuevo en Railway.
2. Subí esta carpeta `backend/` a un repo de GitHub (o arrastrala directo si Railway te lo permite).
3. En Railway: "New Project" → "Deploy from GitHub repo" → elegí el repo.
4. Agregá un servicio de **PostgreSQL** dentro del mismo proyecto Railway ("New" → "Database" → "PostgreSQL").
5. Railway va a generar automáticamente la variable `DATABASE_URL` — solo tenés que
   conectarla al servicio del backend (Railway te lo sugiere solo, o la copiás manualmente
   a las variables de entorno del backend).
6. Railway detecta el `package.json` y corre `npm install` + `npm start` solo.
7. Cuando el deploy termine, Railway te da una URL pública, por ejemplo:
   `https://carteleria-superfontana-production.up.railway.app`

## 2. Cargar los 63 carteles existentes (una sola vez)

1. Copiá la carpeta `referencias/` (la que está dentro del zip del proyecto) adentro de `backend/`,
   al lado de `seed.js`.
2. En tu computadora, con Node instalado, parado en la carpeta `backend/`:
   ```
   npm install
   node seed.js https://TU-URL-DE-RAILWAY.up.railway.app
   ```
3. Vas a ver en la consola "OK [categoria] archivo.png" por cada cartel subido.

## 3. Endpoints disponibles

- `GET  /api/carteles?categoria=02_gondola_producto` → lista los carteles de esa categoría (sin la imagen pesada, solo datos)
- `GET  /api/carteles/:id/imagen` → devuelve la imagen del cartel
- `POST /api/carteles` (form-data: `imagen`, `categoria`, `nombre`) → sube un cartel nuevo
- `PUT  /api/carteles/:id` (form-data: `imagen`) → reemplaza la imagen (para guardar una edición con precio nuevo)
- `DELETE /api/carteles/:id` → borra un cartel

## 4. Conectar el panel web (biblioteca.html)

Abrí `biblioteca.html`, en la parte de arriba vas a ver una línea:
```js
const API_URL = "http://localhost:3000";
```
Cambiala por tu URL de Railway y guardá el archivo. A partir de ahí el panel ya lee y guarda
directo desde el backend.

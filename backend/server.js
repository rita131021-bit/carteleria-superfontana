require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false
});

// crear tabla si no existe, al arrancar
async function initDb() {
  const schema = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
  await pool.query(schema);
  console.log('DB lista (tabla carteles verificada)');
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const CATEGORIAS_VALIDAS = [
  '01_marcas',
  '02_gondola_producto',
  '03_precio_mayorista',
  '04_variedades_mismo_precio',
  '05_sin_imagen_solo_texto',
  '06_logo_plantilla'
];

// Listar carteles (metadata, sin el binario) - filtra por categoria opcional
app.get('/api/carteles', async (req, res) => {
  try {
    const { categoria } = req.query;
    let result;
    if (categoria) {
      result = await pool.query(
        'SELECT id, categoria, nombre, mime_type, created_at FROM carteles WHERE categoria = $1 ORDER BY created_at DESC',
        [categoria]
      );
    } else {
      result = await pool.query(
        'SELECT id, categoria, nombre, mime_type, created_at FROM carteles ORDER BY created_at DESC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar carteles' });
  }
});

// Servir la imagen binaria de un cartel puntual
app.get('/api/carteles/:id/imagen', async (req, res) => {
  try {
    const result = await pool.query('SELECT imagen, mime_type FROM carteles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).send('No encontrado');
    res.set('Content-Type', result.rows[0].mime_type || 'image/png');
    res.send(result.rows[0].imagen);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener imagen');
  }
});

// Subir un cartel nuevo
app.post('/api/carteles', upload.single('imagen'), async (req, res) => {
  try {
    const { categoria, nombre } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo de imagen' });
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      return res.status(400).json({ error: 'Categoria invalida', validas: CATEGORIAS_VALIDAS });
    }
    const result = await pool.query(
      'INSERT INTO carteles (categoria, nombre, mime_type, imagen) VALUES ($1,$2,$3,$4) RETURNING id, categoria, nombre, mime_type, created_at',
      [categoria, nombre || '', req.file.mimetype, req.file.buffer]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el cartel' });
  }
});

// Reemplazar la imagen de un cartel existente (ej: guardar version editada con precio nuevo)
app.put('/api/carteles/:id', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo de imagen' });
    const result = await pool.query(
      'UPDATE carteles SET imagen=$1, mime_type=$2 WHERE id=$3 RETURNING id, categoria, nombre, mime_type, created_at',
      [req.file.buffer, req.file.mimetype, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el cartel' });
  }
});

// Borrar un cartel
app.delete('/api/carteles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM carteles WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al borrar el cartel' });
  }
});

app.get('/', (req, res) => res.send('Backend Cartelería Super Fontana OK'));

const PORT = process.env.PORT || 3000;
initDb().then(() => {
  app.listen(PORT, () => console.log('Servidor corriendo en puerto ' + PORT));
}).catch(err => {
  console.error('Error inicializando la base de datos:', err);
  process.exit(1);
});

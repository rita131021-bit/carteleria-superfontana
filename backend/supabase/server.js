// Backend NUEVO, separado de backend/server.js (que sigue intacto y usando
// el esquema viejo con BYTEA). Este archivo es exclusivo para leer las
// tablas nuevas de Supabase (schema.sql + schema_v2.sql + schema_v3.sql).
//
// Por ahora SOLO LECTURA (GET). Todavia no hay frontend que lo consuma —
// se prepara para cuando exista el proyecto Supabase real y haga falta
// empezar a leer datos desde algun panel.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./client');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend Supabase (solo lectura) - Carteleria Super Fontana OK');
});

// Helper para no repetir el mismo try/catch en cada endpoint
function readTable(tableName) {
  return async (req, res) => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error(`[supabase] error leyendo ${tableName}:`, error.message);
      return res.status(500).json({ error: `No se pudo leer ${tableName}`, detalle: error.message });
    }
    res.json(data);
  };
}

app.get('/api/estilos-comerciales', readTable('estilos_comerciales'));
app.get('/api/marcas', readTable('marcas'));
app.get('/api/plantillas', readTable('plantillas'));
app.get('/api/productos', readTable('productos'));
app.get('/api/carteles-generados', readTable('carteles_generados'));
app.get('/api/atributos-diseno', readTable('atributos_diseno'));

// Traer un estilo con sus atributos relacionados (usa la tabla puente estilos_atributos)
app.get('/api/estilos-comerciales/:id/atributos', async (req, res) => {
  const { data, error } = await supabase
    .from('estilos_atributos')
    .select('atributos_diseno(*)')
    .eq('estilo_id', req.params.id);

  if (error) {
    console.error('[supabase] error leyendo atributos del estilo:', error.message);
    return res.status(500).json({ error: 'No se pudo leer los atributos del estilo', detalle: error.message });
  }
  res.json(data.map(row => row.atributos_diseno));
});

const PORT = process.env.SUPABASE_BACKEND_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend Supabase (solo lectura) corriendo en puerto ${PORT}`);
  console.log('Nota: las lecturas van a devolver error hasta que exista el proyecto Supabase real');
  console.log('      y esten cargadas SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env');
});

// Cliente de conexión a Supabase.
// No reemplaza la conexión a PostgreSQL que usa backend/server.js (viejo) —
// es una conexión nueva y separada, para las tablas nuevas de backend/supabase/*.sql

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // clave de servidor, no la anon publica

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    '[supabase] Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.\n' +
    '           El backend va a arrancar igual, pero las lecturas van a fallar hasta que\n' +
    '           exista el proyecto Supabase real y se carguen esos valores en .env'
  );
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

module.exports = { supabase };

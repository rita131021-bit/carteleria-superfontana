// Carga inicial: sube todos los carteles de la carpeta /referencias al backend, ya clasificados.
// Uso: colocar la carpeta "referencias" (la del zip del proyecto) al lado de este script, y correr:
//   node seed.js  https://TU-BACKEND.up.railway.app
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_URL = process.argv[2] || 'http://localhost:3000';
const REF_DIR = path.join(__dirname, 'referencias');

const CATEGORIAS = [
  '01_marcas',
  '02_gondola_producto',
  '03_precio_mayorista',
  '04_variedades_mismo_precio',
  '05_sin_imagen_solo_texto',
  '06_logo_plantilla'
];

function mimeFromExt(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function subirArchivo(categoria, filePath) {
  const nombre = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: mimeFromExt(filePath) });

  const form = new FormData();
  form.append('categoria', categoria);
  form.append('nombre', nombre);
  form.append('imagen', blob, nombre);

  const res = await fetch(API_URL + '/api/carteles', { method: 'POST', body: form });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fallo subiendo ${nombre}: ${res.status} ${txt}`);
  }
  return res.json();
}

async function main() {
  let total = 0, ok = 0, fail = 0;
  for (const categoria of CATEGORIAS) {
    const dir = path.join(REF_DIR, categoria);
    if (!fs.existsSync(dir)) { console.log('(sin carpeta) ' + categoria); continue; }
    const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
    for (const f of files) {
      total++;
      try {
        await subirArchivo(categoria, path.join(dir, f));
        ok++;
        console.log(`OK  [${categoria}] ${f}`);
      } catch (e) {
        fail++;
        console.error(`ERROR [${categoria}] ${f}: ${e.message}`);
      }
    }
  }
  console.log(`\nListo. Total: ${total} | Subidos: ${ok} | Con error: ${fail}`);
}

main();

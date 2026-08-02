// carga_inicial.js
// Lee recursos/carteles-originales/ y prepara los registros que EN EL FUTURO
// se van a insertar en Supabase (tabla "plantillas", como diseños de referencia).
//
// A PROPOSITO este script NO se conecta a Supabase todavia:
//   - no sube ninguna imagen a Storage
//   - no hace ningun INSERT en la base
// Solo lee la carpeta local y arma un archivo JSON de previsualizacion
// (carga_inicial_preview.json) para revisar que los datos preparados sean
// correctos ANTES de conectar con un proyecto Supabase real.
//
// Cuando se confirme la conexion (client.js con SUPABASE_URL real), este
// mismo manifiesto sirve de base para un segundo script que si suba/inserte.

const fs = require('fs');
const path = require('path');

const CARPETA_ORIGEN = path.join(__dirname, '..', '..', 'recursos', 'carteles-originales');
const SALIDA = path.join(__dirname, 'carga_inicial_preview.json');

// Mapeo de carpeta original -> dato de categoria (informativo, no asume
// ningun estilo_id porque todavia no existe ningun estilo cargado en Supabase)
const CATEGORIAS_CONOCIDAS = [
  '01_marcas',
  '02_gondola_producto',
  '03_precio_mayorista',
  '04_variedades_mismo_precio',
  '05_sin_imagen_solo_texto',
  '06_logo_plantilla'
];

function extensionValida(archivo) {
  return /\.(png|jpe?g|webp)$/i.test(archivo);
}

function prepararRegistros() {
  if (!fs.existsSync(CARPETA_ORIGEN)) {
    console.error('No se encontro la carpeta:', CARPETA_ORIGEN);
    process.exit(1);
  }

  const registros = [];
  const carpetas = fs.readdirSync(CARPETA_ORIGEN).filter(f =>
    fs.statSync(path.join(CARPETA_ORIGEN, f)).isDirectory()
  );

  carpetas.forEach(carpeta => {
    if (!CATEGORIAS_CONOCIDAS.includes(carpeta)) {
      console.warn(`(aviso) carpeta no reconocida, se incluye igual: ${carpeta}`);
    }
    const dirCompleto = path.join(CARPETA_ORIGEN, carpeta);
    const archivos = fs.readdirSync(dirCompleto).filter(extensionValida);

    archivos.forEach(archivo => {
      registros.push({
        // datos que van a viajar a la tabla "plantillas" el dia que se conecte Supabase
        nombre: archivo,
        categoria_original: carpeta,     // referencia de la clasificacion vieja (no existe columna igual en plantillas todavia)
        estilo_id: null,                  // pendiente: no se asigna hasta que existan estilos_comerciales reales
        zonas_editables_json: {},         // pendiente: se completa cuando se definan las zonas de cada diseño
        imagen_url: null,                 // pendiente: se completa recien cuando se suba el archivo a Storage
        archivo_local: path.relative(path.join(__dirname, '..', '..'), path.join(dirCompleto, archivo)),
        estado: 'pendiente_subir_imagen'
      });
    });
  });

  return registros;
}

function main() {
  const registros = prepararRegistros();

  fs.writeFileSync(SALIDA, JSON.stringify(registros, null, 2), 'utf8');

  const resumenPorCategoria = {};
  registros.forEach(r => {
    resumenPorCategoria[r.categoria_original] = (resumenPorCategoria[r.categoria_original] || 0) + 1;
  });

  console.log('Carga inicial preparada (SIN subir nada a Supabase todavia).');
  console.log('Total de registros preparados:', registros.length);
  console.log('Por categoria original:');
  Object.entries(resumenPorCategoria).forEach(([cat, n]) => console.log(`  ${cat}: ${n}`));
  console.log('\nArchivo de previsualizacion generado en:');
  console.log(' ', SALIDA);
  console.log('\nProximo paso (todavia no ejecutado): cuando se confirme la conexion');
  console.log('con un proyecto Supabase real, un segundo script va a leer este mismo');
  console.log('JSON, subir cada imagen a Storage y recien ahi insertar las filas.');
}

main();

-- =====================================================================
-- schema_v4_estilo_premium.sql
-- Suma sobre las migraciones anteriores (no las toca, no toca schema.sql).
--
-- Se saca "Folleto de Marca" del uso previsto: no se necesita un estilo
-- institucional de marca completa. Se deja la fila en la tabla (no se
-- borra, por historial), pero no se va a usar para generar carteles.
--
-- Se agrega el estilo real que faltaba: bebidas alcohólicas premium
-- (vinos, espumantes, whisky, vodka, coñac) — status alto, tipografia
-- elegante, el logo de Super Fontana chico y pegado al precio.
-- =====================================================================

-- Dejar constancia de que "Folleto de Marca" no se usa (sin borrarlo)
update estilos_comerciales
set descripcion = descripcion || ' [NOTA: estilo descartado del uso real, no se genera con este. Se conserva solo por historial.]'
where nombre = 'Folleto de Marca';

insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Premium Bebidas Alcohólicas',
  'vinos, espumantes, whisky, vodka, coñac, licores de alta gama',
  'Bebidas alcoholicas de estatus alto. Tipografia elegante (serif + script), ' ||
  'paleta rica (bordo/dorado/crema o version vibrante segun la linea), botella ' ||
  'protagonista con iconos de notas de cata (sabor, maridaje), pincelada de ' ||
  'color detras del titulo, precio en placa tipo "papel arrancado". El logo de ' ||
  'Super Fontana va chico, generalmente pegado o muy cerca del precio, no ' ||
  'suelto en una esquina.',
  '{
    "fondo": "crema_o_color_de_linea",
    "colores": "bordo_dorado_crema_o_paleta_vibrante_segun_producto",
    "tipografia": "serif_elegante_combinada_con_script_cursiva",
    "decoracion": "iconos_de_cata_pincelada_de_color_ilustracion_de_fondo_sutil",
    "lleva_precio": true,
    "lleva_imagen_producto": true,
    "tamano": {
      "titulo": "grande_serif",
      "precio": "grande_placa_papel",
      "iconos_cata": "chicos"
    },
    "marca": {
      "obligatoria": true,
      "nota": "el nombre del producto/linea (ej: Colon Selecto) es central en el diseño"
    },
    "logo_super_fontana": {
      "tamano": "chico",
      "posicion": "junto_al_precio_o_muy_cerca_no_suelto"
    }
  }'::jsonb
)
on conflict (nombre) do nothing;

-- =====================================================================
-- schema_v3_estilos_por_categoria.sql
-- Suma sobre schema_v2_estilos_comerciales.sql (no lo toca, no toca schema.sql).
--
-- Define un estilo_comercial por cada una de las 6 categorias reales de
-- carteleria, basado en los patrones observados en los 76 carteles de
-- referencias/ (no son datos inventados, son la estructura que ya se
-- analizo sobre las imagenes reales).
--
-- A partir de ahora, todo estilo_comercial tiene en su configuracion_json
-- dos claves nuevas y obligatorias por convencion:
--   "tamano" -> tamaños editables de cada elemento (titulo, precio, badge)
--   "marca"  -> si el diseño requiere marca/logo del producto, y donde va
-- =====================================================================

-- Actualizo el primer estilo (Minimalista Comercial) para que tambien
-- tenga las claves "tamano" y "marca", y quede parejo con el resto.
update estilos_comerciales
set configuracion_json = configuracion_json || '{
  "tamano": {
    "titulo": "grande",
    "precio": "extra_grande",
    "badge_formato": "chico"
  },
  "marca": {
    "obligatoria": false,
    "nota": "el producto fresco no suele llevar marca/logo propio, es genérico"
  }
}'::jsonb
where nombre = 'Minimalista Comercial';

-- ---------------------------------------------------------------------
-- 1) Folleto de Marca (categoria 01_marcas)
-- ---------------------------------------------------------------------
insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Folleto de Marca',
  '01_marcas',
  'Cartel institucional de una marca completa, sin precio. Logo o nombre de ' ||
  'marca grande centrado, cinta o pincelada de color de fondo, presenta la ' ||
  'linea completa de productos de esa marca.',
  '{
    "fondo": "blanco_o_color_de_marca",
    "colores": "propios_de_la_marca",
    "decoracion": "cinta_o_pincelada_de_fondo",
    "lleva_precio": false,
    "tamano": {
      "titulo": "extra_grande",
      "logo_marca": "grande_protagonista"
    },
    "marca": {
      "obligatoria": true,
      "nota": "la marca ES el protagonista del diseño, no un dato secundario"
    }
  }'::jsonb
)
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------
-- 2) Góndola Producto Clásico (categoria 02_gondola_producto)
-- ---------------------------------------------------------------------
insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Góndola Producto Clásico',
  '02_gondola_producto',
  'Nombre del producto arriba en grande, banda de color con formato/gramaje, ' ||
  'foto del producto centrada, precio en banda solida abajo con decimales ' ||
  'chicos en superindice.',
  '{
    "fondo": "blanco",
    "colores": "rojo_verde_o_azul_segun_producto",
    "decoracion": "destellos_y_franjas_de_color",
    "lleva_precio": true,
    "lleva_imagen_producto": true,
    "tamano": {
      "titulo": "grande",
      "precio": "extra_grande",
      "badge_formato": "mediano"
    },
    "marca": {
      "obligatoria": false,
      "nota": "se agrega si el producto es de marca reconocible (ej: Marolio, Nestlé)"
    }
  }'::jsonb
)
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------
-- 3) Mayorista por Cantidad (categoria 03_precio_mayorista)
-- ---------------------------------------------------------------------
insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Mayorista por Cantidad',
  '03_precio_mayorista',
  'Banner "LLEVANDO X UNIDADES" arriba, callout "TE QUEDA A $X CADA UNIDAD", ' ||
  'sello "SOLO CONTADO EFECTIVO" abajo, foto del producto.',
  '{
    "fondo": "blanco_o_color_de_marca",
    "colores": "rojo_y_dorado_predominante",
    "decoracion": "banner_llevando_y_sello_efectivo",
    "lleva_precio": true,
    "lleva_imagen_producto": true,
    "tamano": {
      "banner_cantidad": "extra_grande",
      "precio_unitario": "grande",
      "sello_efectivo": "chico"
    },
    "marca": {
      "obligatoria": false,
      "nota": "se agrega si el producto mayorista es de una marca puntual"
    }
  }'::jsonb
)
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------
-- 4) Variedades Mismo Precio (categoria 04_variedades_mismo_precio)
-- ---------------------------------------------------------------------
insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Variedades Mismo Precio',
  '04_variedades_mismo_precio',
  '2 o mas variantes del mismo producto (sabores, formatos) apiladas o lado ' ||
  'a lado, con un unico precio final aplicable a todas.',
  '{
    "fondo": "blanco",
    "colores": "rojo_predominante",
    "decoracion": "minima",
    "lleva_precio": true,
    "lleva_imagen_producto": true,
    "cantidad_variantes": "2_o_mas",
    "tamano": {
      "titulo": "grande",
      "precio_unico": "extra_grande",
      "imagenes_variantes": "medianas_apiladas"
    },
    "marca": {
      "obligatoria": true,
      "nota": "las variedades pertenecen siempre a una marca especifica (ej: Nevares, Quilmes)"
    }
  }'::jsonb
)
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------
-- 5) Sin Imagen (categoria 05_sin_imagen_solo_texto)
-- ---------------------------------------------------------------------
insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Sin Imagen Solo Texto',
  '05_sin_imagen_solo_texto',
  'Caja con borde, titulo "OFERTA" arriba, nombre del producto en mayuscula ' ||
  'centrado, precio en recuadro abajo, sin foto de producto.',
  '{
    "fondo": "blanco",
    "colores": "negro_y_rojo",
    "decoracion": "caja_con_borde",
    "lleva_precio": true,
    "lleva_imagen_producto": false,
    "tamano": {
      "titulo_oferta": "mediano",
      "nombre_producto": "grande",
      "precio": "extra_grande"
    },
    "marca": {
      "obligatoria": false,
      "nota": "al no haber imagen, la marca casi nunca es relevante en este formato"
    }
  }'::jsonb
)
on conflict (nombre) do nothing;

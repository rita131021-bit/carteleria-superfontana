-- =====================================================================
-- schema_v6_estilo_limpieza.sql
-- Suma sobre las migraciones anteriores (no las toca, no toca schema.sql).
--
-- Estilo "Limpieza" definido a partir de 5 carteles reales de Cristalíes
-- (jabon liquido max, desinfectante pisos, jabon liquido 3lt, suavizante
-- ropas, jabon liquido 5lt) — mismo esqueleto de diseño en los 5, el
-- color cambia segun la linea/aroma del producto.
-- =====================================================================

insert into estilos_comerciales (nombre, tipo_producto, descripcion, configuracion_json)
values (
  'Limpieza',
  'limpieza / detergentes / jabon liquido / suavizantes / desinfectantes',
  'Fondo blanco con borde fino del color de la marca. Logo de marca estilo ' ||
  'burbuja/comic (rojo + azul) arriba. Nombre del producto en azul marino, ' ||
  'mayuscula, apilado en 2-3 lineas, con destellos flanqueando. Badge de ' ||
  'formato (litros) en rectangulo redondeado azul marino con texto blanco. ' ||
  'Botella protagonista grande a la derecha. Precio rojo grande abajo con ' ||
  'trazo curvo de subrayado, decimales chicos.',
  '{
    "fondo": "blanco",
    "borde": "fino_color_de_marca",
    "colores": "varia_segun_linea_de_producto_clasico_azul_lavanda_violeta_celeste",
    "tipografia": "sans_bold_condensada_mayuscula_apilada",
    "decoracion": "destellos_flanqueando_titulo_lineas_divisorias_finas",
    "lleva_precio": true,
    "lleva_imagen_producto": true,
    "tamano": {
      "logo_marca": "mediano_arriba",
      "titulo": "grande_apilado",
      "badge_formato": "mediano",
      "precio": "extra_grande"
    },
    "marca": {
      "obligatoria": true,
      "nota": "el logo de la marca de limpieza (ej: Cristalíes) va arriba, estilo burbuja/comic"
    },
    "identidad_producto": {
      "heredar_colores_de_marca": true,
      "heredar_tipografia_de_marca": true,
      "logo_o_isotipo_producto": "usar el logo real de la marca de limpieza",
      "nota": "el color cambia segun la linea (clasico=azul, lavanda=violeta, etc.) pero el esqueleto del diseño se mantiene igual"
    },
    "logo_super_fontana": {
      "nota": "estos 5 ejemplos de referencia no lo muestran, pero aplica la regla general del sistema: siempre debe ir presente"
    }
  }'::jsonb
)
on conflict (nombre) do nothing;

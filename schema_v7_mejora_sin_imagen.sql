-- =====================================================================
-- schema_v7_mejora_sin_imagen.sql
-- Suma sobre las migraciones anteriores (no las toca, no toca schema.sql).
--
-- Mejora la definicion de 'Sin Imagen Solo Texto' con el patron real
-- visto en 3 carteles nuevos (Huevos Blanco/Pepino, Calabaza/Batata):
-- linea punteada roja como divisor, ramita/hojas decorativas a cada
-- lado del divisor, destellos flanqueando el subtitulo, y formato de
-- "2 carteles por hoja" con borde alternado (uno negro, uno rojo).
-- =====================================================================

update estilos_comerciales
set descripcion = 'Caja con borde redondeado (alternando negro y rojo cuando van 2 carteles ' ||
                   'juntos en una misma hoja). Nombre del producto arriba en mayuscula. Linea ' ||
                   'punteada roja como divisor. Subtitulo (formato/cantidad) con destellos a ' ||
                   'los costados, flanqueado por una ramita con hojas a cada lado del divisor. ' ||
                   'Precio grande abajo, con destellos tambien a los costados. Sin foto de producto.',
    configuracion_json = configuracion_json || '{
      "decoracion": "linea_punteada_roja_divisor_ramita_con_hojas_destellos_flanqueando",
      "borde": "redondeado_alternando_negro_y_rojo_si_hay_2_por_hoja",
      "layout_multiple": "hasta_2_carteles_por_hoja_apilados",
      "tamano": {
        "titulo_producto": "grande",
        "subtitulo_formato": "mediano",
        "precio": "extra_grande"
      }
    }'::jsonb
where nombre = 'Sin Imagen Solo Texto';

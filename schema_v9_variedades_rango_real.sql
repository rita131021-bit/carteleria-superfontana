-- =====================================================================
-- schema_v9_variedades_rango_real.sql
-- Suma sobre las migraciones anteriores (no las toca, no toca schema.sql).
--
-- Actualiza 'Variedades Mismo Precio' con el rango real visto en 4
-- carteles nuevos: Shampoo/Acondicionador Suave (6 variantes), Bebidas
-- H2!Oh (2 variantes), Fragancias Esencial (7 variantes), Cerveza Andes
-- Origen (5 variantes). El rango real es de 2 a 7+ variantes, no solo 2.
--
-- Tambien documenta una variante visual del precio: en placa recta
-- (como Budin Fantasia) O en forma de estallido/explosion irregular
-- (como Bebidas de origen, Fragancias, Cerveza Andes) - ambas validas,
-- se elige segun el tono del cartel (mas suave vs mas urgente/oferton).
-- =====================================================================

update estilos_comerciales
set descripcion = '2 o mas variantes del mismo producto (sabores, formatos, fragancias) ' ||
                   'apiladas o en fila, con un unico precio final aplicable a todas. El ' ||
                   'rango real va de 2 variantes hasta 7 u 8 en una sola fila si el ' ||
                   'producto lo permite (ej: fragancias, shampoos). El precio puede ir en ' ||
                   'una placa recta (mas prolijo) o en forma de estallido/explosion ' ||
                   'irregular (mas urgente, tipo oferton).',
    configuracion_json = configuracion_json || '{
      "cantidad_variantes": "2_hasta_7_u_8_en_fila",
      "variante_precio": {
        "placa_recta": "mas prolijo, tono tranquilo (ej: Budin Fantasia)",
        "estallido_explosion": "mas urgente, tono oferton (ej: bebidas, fragancias, cerveza)"
      }
    }'::jsonb
where nombre = 'Variedades Mismo Precio';

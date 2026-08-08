-- =====================================================================
-- schema_v8_minimalista_perecederos.sql
-- Suma sobre las migraciones anteriores (no las toca, no toca schema.sql).
--
-- Amplia el alcance de 'Minimalista Comercial': ya no es solo verduleria,
-- es el estilo para TODOS los departamentos de productos frescos /
-- perecederos: verduleria, fruteria, carniceria, lacteos/heladera, huevos.
-- El esqueleto se mantiene (fondo blanco, producto protagonista, precio
-- extremadamente visible, decoracion minima) pero el color de acento
-- varia segun el departamento.
--
-- Basado en 6 carteles reales nuevos: Repollo Blanco, Pera, Batata
-- Blanca, Zanahoria (verduleria/fruteria), Tapa para Pascualina
-- (lacteos/congelados), Alitas de Pollo (carniceria).
-- =====================================================================

update estilos_comerciales
set tipo_producto = 'verduleria, fruteria, carniceria, lacteos/heladera, huevos (perecederos en general)',
    descripcion = 'Fondo blanco limpio. Mucho espacio negativo. Un solo producto protagonista. ' ||
                   'Jerarquia tipografica muy fuerte. Precio extremadamente visible. Elementos ' ||
                   'decorativos minimos (hojas, destellos, pinceladas o cintas segun el rubro). ' ||
                   'El color de acento cambia segun el departamento: verde para verdulera en general, ' ||
                   'naranja para zanahoria y frutas calidas, rojo-amarillo mas bold para carniceria, ' ||
                   'azul para lacteos/congelados. La estructura minimalista se mantiene igual en todos.',
    configuracion_json = configuracion_json || '{
      "colores": "verde_verdulera_naranja_frutas_rojo_amarillo_carniceria_azul_lacteos",
      "variacion_por_departamento": {
        "verduleria_fruteria": "verde o color natural del alimento, decoracion con hojas",
        "carniceria": "rojo y amarillo, mas bold que el resto, franja curva divisoria",
        "lacteos_heladera": "azul, sello circular tipo stamp con recomendacion de uso",
        "huevos": "similar a verdulera, foto del maple protagonista"
      }
    }'::jsonb
where nombre = 'Minimalista Comercial';

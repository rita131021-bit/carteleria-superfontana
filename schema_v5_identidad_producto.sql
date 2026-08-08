-- =====================================================================
-- schema_v5_identidad_producto.sql
-- Suma sobre las migraciones anteriores (no las toca, no toca schema.sql).
--
-- Regla transversal aclarada por Kikyta con ejemplos reales (Monarca,
-- Quilmes, Signo): el cartel tiene que heredar la identidad visual del
-- PRODUCTO que muestra (sus propios colores de marca, su tipografia,
-- su logo/isotipo si lo tiene) — no un color fijo del sistema.
--
-- El logo de Super Fontana sigue yendo aparte (chico, generalmente
-- abajo o pegado al precio segun el estilo) — es la identidad del
-- PRODUCTO la que se adapta, no la del supermercado.
-- =====================================================================

update estilos_comerciales
set configuracion_json = configuracion_json || '{
  "identidad_producto": {
    "heredar_colores_de_marca": true,
    "heredar_tipografia_de_marca": "cuando el producto tenga una tipografia propia reconocible",
    "logo_o_isotipo_producto": "usar si el producto lo tiene (ej: corona de Monarca, ondas de Signo)",
    "nota": "el cartel se viste con la identidad del producto (Monarca, Quilmes, Signo, etc.), no con un color fijo del sistema. El logo de Super Fontana va aparte, segun la posicion definida en cada estilo."
  }
}'::jsonb
where nombre != 'Folleto de Marca'; -- ese queda descartado, no se actualiza

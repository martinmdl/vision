unifyDataFrameQuery = """
    WITH fechas AS (
        SELECT DISTINCT v.id_sucursal, v.creacion
        FROM ventas v
    ),
    ventas_agrupadas AS (
        SELECT
            v.id_sucursal,
            v.creacion,
            dv.id_producto,
            SUM(dv.cantidad) AS cantidad_vendida
        FROM ventas v
        INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
        GROUP BY v.id_sucursal, v.creacion, dv.id_producto
    ),
    feriados AS (
        SELECT DISTINCT 
            f.fecha,
            tf.tipo,
            f.nombre
        FROM feriado f
        INNER JOIN tipo_feriado tf ON tf.id_tipo_feriado = f.tipo
    )
    SELECT
        f.id_sucursal,
        p.nombre,
        f.creacion,
        COALESCE(va.cantidad_vendida, 0) AS cantidad_vendida,
        c.temp_avg,
        c.temp_min,
        c.temp_max,
        c.humedad,
        c.lluvia,
        c.viento,
        c.presion,
        c.nubosidad,
        COALESCE(fer.tipo, '-') AS tipo_feriado,
        COALESCE(fer.nombre, '-') AS feriado
    FROM fechas f
    INNER JOIN productos p ON p.id_sucursal = f.id_sucursal
    LEFT JOIN ventas_agrupadas va 
    ON va.id_sucursal = f.id_sucursal 
    AND va.creacion = f.creacion
    AND va.id_producto = p.id_producto
    LEFT JOIN clima c
    ON c.fecha = f.creacion
    LEFT JOIN feriados fer ON fer.fecha = f.creacion
    GROUP BY f.id_sucursal, p.nombre, f.creacion, va.cantidad_vendida, c.temp_avg, c.temp_min, c.temp_max, 
    c.humedad, c.lluvia, c.viento, c.presion, c.nubosidad, fer.tipo, fer.nombre
    ORDER BY f.id_sucursal, f.creacion, p.nombre;
"""

getDBLastYearQuery = "SELECT MAX(EXTRACT(YEAR FROM creacion)) FROM ventas"

getDBProducts = "SELECT id_producto, nombre, id_sucursal FROM productos"

getDBProductsBySucursalQuery = """
    SELECT id_producto, nombre, id_sucursal
    FROM productos
    WHERE id_sucursal = :id_sucursal
    ORDER BY id_producto;
"""

getDBFeriados = """
    SELECT DISTINCT ON (fer.fecha)
        fer.fecha,
        fer.nombre,
        tf.tipo
    FROM feriado fer
    INNER JOIN tipo_feriado tf 
        ON fer.tipo = tf.id_tipo_feriado
    ORDER BY 
        fer.fecha,
        CASE WHEN tf.tipo = 'efemeride' THEN 1 ELSE 2 END;
"""

getTopSoldProductsQuery = """
    SELECT
        p.nombre AS nombre,
        COALESCE(SUM(dv.cantidad), 0) AS total_vendido
    FROM detalle_ventas dv
    INNER JOIN productos as p
    ON p.id_producto = dv.id_producto
    WHERE (dv.cancelada IS NULL OR dv.cancelada = FALSE)
    AND (dv.activo IS NULL OR dv.activo = TRUE)
    GROUP BY p.nombre
    ORDER BY total_vendido DESC
    LIMIT :limit;
"""

listSucursalesAllQuery = """
    SELECT id_sucursal, nombre, activo, creacion, actualizacion
    FROM sucursal
    ORDER BY id_sucursal;
"""

listSucursalesActivasQuery = """
    SELECT id_sucursal, nombre, activo, creacion, actualizacion
    FROM sucursal
    WHERE activo = true
    ORDER BY id_sucursal;
"""

createSucursalQuery = """
    INSERT INTO sucursal (nombre, creacion, actualizacion, activo)
    VALUES (:nombre, NOW(), NOW(), true)
    RETURNING id_sucursal;
"""

updateSucursalNombreQuery = """
    UPDATE sucursal
    SET nombre = :nombre,
        actualizacion = NOW()
    WHERE id_sucursal = :id;
"""

updateSucursalActivoQuery = """
    UPDATE sucursal
    SET activo = :activo,
        actualizacion = NOW()
    WHERE id_sucursal = :id;
"""
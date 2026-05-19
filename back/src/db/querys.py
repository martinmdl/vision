unifyDataFrameQuery = """
    WITH fechas AS (
        SELECT DISTINCT creacion
        FROM detalle_ventas
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
        p.nombre,
        f.creacion,
        COALESCE(SUM(dv.cantidad), 0) AS cantidad_vendida,
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
    FROM productos p
    CROSS JOIN fechas f
    LEFT JOIN detalle_ventas dv 
    ON dv.id_producto = p.id_producto 
    AND dv.creacion = f.creacion
    LEFT JOIN clima c
    ON c.fecha = f.creacion
    LEFT JOIN feriados fer ON fer.fecha = f.creacion
    GROUP BY p.nombre, f.creacion, c.temp_avg, c.temp_min, c.temp_max, 
    c.humedad, c.lluvia, c.viento, c.presion, c.nubosidad, fer.tipo, fer.nombre
    ORDER BY f.creacion, p.nombre;
"""

getDBLastYearQuery = "SELECT MAX(EXTRACT(YEAR FROM creacion)) FROM ventas"

getDBProducts = "SELECT id_producto, nombre FROM productos"

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
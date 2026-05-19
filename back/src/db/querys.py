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

getTopProfitableProductsQuery = """
    SELECT
        p.nombre AS nombre,
        COALESCE(SUM(dv.cantidad * (COALESCE(dv.precio, 0) - COALESCE(dv.costo, 0))), 0) AS total_ganancia
    FROM detalle_ventas dv
    INNER JOIN productos AS p
        ON p.id_producto = dv.id_producto
    WHERE (dv.cancelada IS NULL OR dv.cancelada = FALSE)
        AND (dv.activo IS NULL OR dv.activo = TRUE)
    GROUP BY p.nombre
    ORDER BY total_ganancia DESC
    LIMIT :limit;
"""

getWeatherImpactIncomeQuery = """
    SELECT
        TO_CHAR(v.creacion, 'YYYY-MM') AS mes,
        COALESCE(
            SUM(CASE WHEN COALESCE(c.lluvia, 0) > 0 THEN COALESCE(v.total, 0) ELSE 0 END)
            / NULLIF(COUNT(DISTINCT CASE WHEN COALESCE(c.lluvia, 0) > 0 THEN v.creacion END), 0),
            0
        ) AS ingreso_lluvioso,
        COALESCE(
            SUM(CASE WHEN COALESCE(c.lluvia, 0) = 0 AND COALESCE(c.nubosidad, 0) <= 30 THEN COALESCE(v.total, 0) ELSE 0 END)
            / NULLIF(COUNT(DISTINCT CASE WHEN COALESCE(c.lluvia, 0) = 0 AND COALESCE(c.nubosidad, 0) <= 30 THEN v.creacion END), 0),
            0
        ) AS ingreso_despejado
    FROM ventas v
    INNER JOIN clima c
        ON c.fecha = v.creacion
    WHERE (v.activo IS NULL OR v.activo = TRUE)
    GROUP BY TO_CHAR(v.creacion, 'YYYY-MM'), EXTRACT(YEAR FROM v.creacion), EXTRACT(MONTH FROM v.creacion)
    ORDER BY EXTRACT(YEAR FROM v.creacion), EXTRACT(MONTH FROM v.creacion);
"""

getCalendarImpactIncomeQuery = """
    WITH ventas_diarias AS (
        SELECT
            v.creacion::date AS fecha,
            COALESCE(SUM(v.total), 0) AS ingreso_dia
        FROM ventas v
        WHERE (v.activo IS NULL OR v.activo = TRUE)
        GROUP BY v.creacion::date
    ),
    clasificacion_dias AS (
        SELECT
            vd.fecha,
            vd.ingreso_dia,
            CASE
                WHEN f.fecha IS NOT NULL THEN 'festivo'
                WHEN EXTRACT(ISODOW FROM vd.fecha) IN (6, 7) THEN 'fin_semana'
                ELSE 'normal'
            END AS tipo_dia
        FROM ventas_diarias vd
        LEFT JOIN feriado f
            ON f.fecha = vd.fecha
            AND (f.activo IS NULL OR f.activo = TRUE)
    )
    SELECT
        TO_CHAR(cd.fecha, 'YYYY-MM') AS mes,
        COALESCE(
            SUM(CASE WHEN cd.tipo_dia = 'festivo' THEN cd.ingreso_dia ELSE 0 END)
            / NULLIF(COUNT(CASE WHEN cd.tipo_dia = 'festivo' THEN 1 END), 0),
            0
        ) AS ingreso_festivo,
        COALESCE(
            SUM(CASE WHEN cd.tipo_dia = 'normal' THEN cd.ingreso_dia ELSE 0 END)
            / NULLIF(COUNT(CASE WHEN cd.tipo_dia = 'normal' THEN 1 END), 0),
            0
        ) AS ingreso_normal,
        COALESCE(
            SUM(CASE WHEN cd.tipo_dia = 'fin_semana' THEN cd.ingreso_dia ELSE 0 END)
            / NULLIF(COUNT(CASE WHEN cd.tipo_dia = 'fin_semana' THEN 1 END), 0),
            0
        ) AS ingreso_fin_semana
    FROM clasificacion_dias cd
    GROUP BY TO_CHAR(cd.fecha, 'YYYY-MM'), EXTRACT(YEAR FROM cd.fecha), EXTRACT(MONTH FROM cd.fecha)
    ORDER BY EXTRACT(YEAR FROM cd.fecha), EXTRACT(MONTH FROM cd.fecha);
"""

getCalendarUpliftQuery = """
    WITH ventas_diarias AS (
        SELECT
            v.creacion::date AS fecha,
            COALESCE(SUM(v.total), 0) AS ingreso_dia
        FROM ventas v
        WHERE (v.activo IS NULL OR v.activo = TRUE)
        GROUP BY v.creacion::date
    ),
    clasificacion_dias AS (
        SELECT
            vd.fecha,
            vd.ingreso_dia,
            CASE
                WHEN f.fecha IS NOT NULL THEN 'festivo'
                WHEN EXTRACT(ISODOW FROM vd.fecha) IN (6, 7) THEN 'fin_semana'
                ELSE 'normal'
            END AS tipo_dia
        FROM ventas_diarias vd
        LEFT JOIN feriado f
            ON f.fecha = vd.fecha
            AND (f.activo IS NULL OR f.activo = TRUE)
    ),
    promedios AS (
        SELECT
            COALESCE(AVG(CASE WHEN tipo_dia = 'normal' THEN ingreso_dia END), 0) AS ingreso_normal,
            COALESCE(AVG(CASE WHEN tipo_dia = 'festivo' THEN ingreso_dia END), 0) AS ingreso_festivo,
            COALESCE(AVG(CASE WHEN tipo_dia = 'fin_semana' THEN ingreso_dia END), 0) AS ingreso_fin_semana
        FROM clasificacion_dias
    )
    SELECT
        COALESCE(((ingreso_festivo - ingreso_normal) / NULLIF(ingreso_normal, 0)) * 100, 0) AS incremento_feriado,
        COALESCE(((ingreso_fin_semana - ingreso_normal) / NULLIF(ingreso_normal, 0)) * 100, 0) AS incremento_fin_semana
    FROM promedios;
"""
import pandas as pd
import time

def clean_xls(xls_file, mapeo):
    t0 = time.time()

    df_venta         = _extraer_df(xls_file, mapeo["VENTAS"])
    df_producto      = _extraer_df(xls_file, mapeo["PRODUCTOS"])
    df_detalle_venta = _extraer_df(xls_file, mapeo["DETALLE_VENTAS"])
    print(f"  [1a] read_excel: {time.time() - t0:.2f}s")

    t1 = time.time()

    # Agregar id autoincremental a productos
    df_producto.insert(0, "id_producto", range(1, len(df_producto) + 1))

    # Reemplazar columna "producto" en detalle_venta por id_producto
    mapa_nombre_id = dict(zip(df_producto["nombre"], df_producto["id_producto"]))
    df_detalle_venta["id_producto"] = df_detalle_venta["producto"].map(mapa_nombre_id)
    df_detalle_venta = df_detalle_venta.drop(columns=["producto"])

    # Limpieza antes de agregar campos generados
    df_venta         = _limpiar_df(df_venta)
    df_producto      = _limpiar_df(df_producto)
    df_detalle_venta = _limpiar_df(df_detalle_venta)

    # id_detalle después de limpiar para evitar huecos
    df_detalle_venta.insert(0, "id_detalle", range(1, len(df_detalle_venta) + 1))

    now = pd.Timestamp.now().replace(microsecond=0)

    # ventas: creacion viene del Excel
    df_venta["actualizacion"] = df_venta["creacion"]
    df_venta["activo"]        = True

    # detalle_venta: hereda creacion de su venta correspondiente
    mapa_fecha = dict(zip(df_venta["id_venta"], df_venta["creacion"]))
    df_detalle_venta["creacion"]      = df_detalle_venta["id_venta"].map(mapa_fecha)
    df_detalle_venta["actualizacion"] = df_detalle_venta["creacion"]
    df_detalle_venta["activo"]        = True

    # productos: creacion generada por código
    df_producto["creacion"]      = now
    df_producto["actualizacion"] = now
    df_producto["activo"]        = True

    print(f"  [1b] transformaciones + limpieza: {time.time() - t1:.2f}s")

    return df_venta, df_producto, df_detalle_venta


def _extraer_df(xls_file, tabla_info):
    col_map = {
        excel_col: db_field
        for db_field, excel_col in tabla_info["mapeo"].items()
        if excel_col is not None
    }

    df = pd.read_excel(
        xls_file,
        sheet_name=tabla_info["sheet"],
        header=tabla_info.get("header_row", 0)
    )

    cols_presentes = [c for c in col_map if c in df.columns]
    df = df[cols_presentes].rename(columns=col_map)

    return df


def _limpiar_df(df):
    # Filas completamente vacías
    df = df.dropna(how="all").reset_index(drop=True)

    # En detalle_venta, filas donde no se pudo mapear el producto
    if "id_producto" in df.columns:
        df = df.dropna(subset=["id_producto"]).reset_index(drop=True)
        df["id_producto"] = df["id_producto"].astype(int)

    # Normalizar strings: strip de espacios
    str_cols = df.select_dtypes(include="object").columns
    df[str_cols] = df[str_cols].apply(lambda col: col.str.strip())

    # Convertir columnas booleanas: detectar las que solo tienen Si/No, Yes/No, True/False
    VALORES_TRUE  = {"si", "yes", "true", "1", "s", "y"}
    VALORES_FALSE = {"no", "false", "0", "n"}
    VALORES_BOOL  = VALORES_TRUE | VALORES_FALSE

    for col in df.select_dtypes(include="object").columns:
        valores = df[col].dropna().str.lower().unique()
        if len(valores) > 0 and set(valores).issubset(VALORES_BOOL):
            df[col] = df[col].str.lower().map(
                lambda v: True if v in VALORES_TRUE else (False if v in VALORES_FALSE else None)
            )

    # Reemplazar strings vacíos por NaN para consistencia
    df.replace("", pd.NA, inplace=True)

    return df
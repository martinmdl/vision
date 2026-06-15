import pandas as pd
import uuid
import time
from sqlalchemy import text

from src.db.engine import engine


def get_current_max_ids():
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT
                    COALESCE((SELECT MAX(id_venta) FROM ventas), 0) AS max_id_venta,
                    COALESCE((SELECT MAX(id_producto) FROM productos), 0) AS max_id_producto,
                    COALESCE((SELECT MAX(id_detalle) FROM detalle_ventas), 0) AS max_id_detalle
                """
            )
        ).mappings().first()

    return {
        "id_venta": int(row["max_id_venta"] or 0),
        "id_producto": int(row["max_id_producto"] or 0),
        "id_detalle": int(row["max_id_detalle"] or 0),
    }

def clean_xls(xls_file, id_sucursal=None):
    t0 = time.time()
    df_venta = pd.read_excel(xls_file, sheet_name="Ventas", skiprows=3)
    df_producto = pd.read_excel(xls_file, sheet_name="Productos")
    df_detalle_venta = pd.read_excel(xls_file, sheet_name="Adiciones")
    print(f"  [1a] read_excel: {time.time() - t0:.2f}s")
    
    t1 = time.time()
    max_ids = get_current_max_ids()
    df_venta, mapa_ventas = clean_venta(df_venta, max_ids["id_venta"] + 1)
    df_producto, mapa_productos = clean_producto(df_producto, max_ids["id_producto"] + 1)
    df_detalle_venta = clean_detalle_venta(
        df_detalle_venta,
        df_venta,
        mapa_ventas,
        mapa_productos,
        max_ids["id_detalle"] + 1,
    )

    if id_sucursal is not None:
        df_venta["id_sucursal"] = id_sucursal
        df_producto["id_sucursal"] = id_sucursal

    print(f"  [1b] clean: {time.time() - t1:.2f}s")

    return df_venta, df_producto, df_detalle_venta

def clean_venta(df_venta, start_id_venta):
    df_venta = df_venta.drop(columns=[
        "Fecha", "Cerrada", "Caja", "Estado", "Cliente", "Mesa", "Sala",
        "Personas", "Camarero / Repartidor", "Medio de Pago", "Fiscal", "Comentario", "Origen", "Id. Origen"
    ], errors='ignore')

    df_venta = df_venta.sort_values(by=["Id"]).reset_index(drop=True)
    df_venta["id_venta"] = range(start_id_venta, start_id_venta + len(df_venta))
    mapa_ventas = dict(zip(df_venta["Id"], df_venta["id_venta"]))

    df_venta["Creación"] = pd.to_datetime(df_venta["Creación"])
    df_venta["actualizacion"] = df_venta["Creación"]

    df_venta["activo"] = True

    df_venta = df_venta.rename(columns={
        "Creación": "creacion",
        "Total": "total",
        "Tipo de Venta": "tipo"
    })

    df_venta = df_venta[["id_venta", "total", "tipo", "creacion", "actualizacion", "activo"]]
    
    return df_venta, mapa_ventas

def clean_producto(df_producto, start_id_producto):
    # Elimina columna innecesarias
    df_producto = df_producto.drop(columns=[
        "Código", "Subcategoria", "Contiene modificadores",
        "Cant. en adiciones", "Cant. en modificadores"
    ], errors='ignore')

    df_producto["creacion"] = df_producto["actualizacion"] = pd.Timestamp.now().replace(microsecond=0)
    df_producto["activo"] = True

    # Renombrar columnas
    df_producto = df_producto.rename(columns={
        "Nombre": "nombre",
        "Categoría": "categoria",
        "Cantidad": "cantidad",
        "Total ($)": "total_ars"
    })


    # Crear PK incremental `id_producto` similar a otras tablas
    df_producto = df_producto.reset_index(drop=True)
    df_producto["id_producto"] = range(start_id_producto, start_id_producto + len(df_producto))
    mapa_productos = dict(zip(df_producto["nombre"], df_producto["id_producto"]))

    # Reordenar para tener la PK al principio
    df_producto = df_producto[["id_producto", "nombre", "categoria", "cantidad", "total_ars", "creacion", "actualizacion", "activo"]]
    
    return df_producto, mapa_productos

def clean_detalle_venta(df_detalle_venta, df_venta, mapa_ventas, mapa_productos, start_id_detalle):
    df_detalle_venta = df_detalle_venta.drop(columns=[
        "Costo modificadores", "Costo total", "Creada por", "Cocina",
        "Cancelada por", "Comentario", "Comentario de cancelación"
    ], errors='ignore')

    df_detalle_venta = df_detalle_venta.sort_values(by=["Id. Venta"]).reset_index(drop=True)

    df_detalle_venta["Creación"] = pd.to_datetime(df_detalle_venta["Creación"])

    # Mapear nombre de producto a la nueva PK `id_producto`
    df_detalle_venta["id_producto"] = df_detalle_venta["Producto"].map(mapa_productos)
    # Eliminar filas sin idProducto (productos no mapeados)
    df_detalle_venta = df_detalle_venta.dropna(subset=["id_producto"])
    df_detalle_venta = df_detalle_venta.reset_index(drop=True) # Reindexar despues de dropna 
    df_detalle_venta["id_producto"] = df_detalle_venta["id_producto"].astype(int)
    df_detalle_venta["id_venta"] = df_detalle_venta["Id. Venta"].map(mapa_ventas)
    df_detalle_venta = df_detalle_venta.dropna(subset=["id_venta"])
    df_detalle_venta = df_detalle_venta.reset_index(drop=True)
    df_detalle_venta["id_venta"] = df_detalle_venta["id_venta"].astype(int)
    df_detalle_venta = df_detalle_venta.drop(columns=["Producto", "Categoría"])
    df_detalle_venta = df_detalle_venta.drop(columns=["Id. Venta"])

    df_detalle_venta["Cancelada"] = df_detalle_venta["Cancelada"].map({"Si": True, "No": False})

    df_detalle_venta_aux = df_detalle_venta.merge(
        df_venta[["id_venta", "creacion"]],
        on="id_venta",
        how="left"
    )
    df_detalle_venta["creacion"] = df_detalle_venta["actualizacion"] = df_detalle_venta_aux["creacion"]

    df_detalle_venta["activo"] = True

    df_detalle_venta = df_detalle_venta.rename(columns={
        "Cantidad": "cantidad",
        "Cancelada": "cancelada",
        "Precio": "precio",
        "Costo base": "costo"
    })

    df_detalle_venta["id_detalle"] = range(start_id_detalle, start_id_detalle + len(df_detalle_venta))

    df_detalle_venta = df_detalle_venta[["id_detalle","id_venta","id_producto","cantidad","precio","costo","cancelada","creacion","actualizacion","activo"]]
    
    return df_detalle_venta
import pandas as pd
import uuid

def clean_xls(xls_file):
    df_venta = pd.read_excel(xls_file, sheet_name="Ventas", skiprows=3)
    df_producto = pd.read_excel(xls_file, sheet_name="Productos")
    df_detalle_venta = pd.read_excel(xls_file, sheet_name="Adiciones")
    
    df_venta = clean_venta(df_venta)
    df_producto = clean_producto(df_producto)
    df_detalle_venta = clean_detalle_venta(df_detalle_venta, df_producto, df_venta)

    return df_venta, df_producto, df_detalle_venta

def clean_venta(df_venta):
    df_venta = df_venta.drop(columns=[
        "Fecha", "Cerrada", "Caja", "Estado", "Cliente", "Mesa", "Sala",
        "Personas", "Camarero / Repartidor", "Medio de Pago", "Fiscal", "Comentario", "Origen", "Id. Origen"
    ], errors='ignore')

    df_venta = df_venta.sort_values(by=["Id"]).reset_index(drop=True)

    df_venta["Creación"] = pd.to_datetime(df_venta["Creación"])
    df_venta["actualizacion"] = df_venta["Creación"]

    df_venta["activo"] = True

    df_venta = df_venta.rename(columns={
        "Id": "id_venta",
        "Creación": "creacion",
        "Total": "total",
        "Tipo de Venta": "tipo"
    })

    df_venta = df_venta[["id_venta", "total", "tipo", "creacion", "actualizacion", "activo"]]
    
    return df_venta

def clean_producto(df_producto):
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
    df_producto = df_producto[["nombre", "categoria", "cantidad", "total_ars", "creacion", "actualizacion", "activo"]]
    
    return df_producto

def clean_detalle_venta(df_detalle_venta, df_producto, df_venta):
    df_detalle_venta = df_detalle_venta.drop(columns=[
        "Costo modificadores", "Costo total", "Creada por", "Cocina",
        "Cancelada por", "Comentario", "Comentario de cancelación"
    ], errors='ignore')

    df_detalle_venta = df_detalle_venta.sort_values(by=["Id. Venta"]).reset_index(drop=True)
    df_detalle_venta["id_detalle"] = range(1, len(df_detalle_venta) + 1)

    df_detalle_venta["Creación"] = pd.to_datetime(df_detalle_venta["Creación"])

    mapa = dict(zip(df_producto["nombre"], df_producto["nombre"]))
    df_detalle_venta["id_producto"] = df_detalle_venta["Producto"].map(mapa)
    # Eliminar filas sin idProducto (productos no mapeados)
    df_detalle_venta = df_detalle_venta.dropna(subset=["id_producto"])
    df_detalle_venta = df_detalle_venta.drop(columns=["Producto", "Categoría"])
    df_detalle_venta = df_detalle_venta.reset_index(drop=True) # Reindexar despues de dropna 

    df_detalle_venta["Cancelada"] = df_detalle_venta["Cancelada"].map({"Si": True, "No": False})

    df_detalle_venta_aux = df_detalle_venta.merge(
        df_venta[["id_venta", "creacion"]],
        left_on="Id. Venta",
        right_on="id_venta",
        how="left"
    )
    df_detalle_venta["creacion"] = df_detalle_venta["actualizacion"] = df_detalle_venta_aux["creacion"]

    df_detalle_venta["activo"] = True

    df_detalle_venta = df_detalle_venta.rename(columns={
        "Id. Venta": "id_venta",
        "Cantidad": "cantidad",
        "Cancelada": "cancelada",
        "Precio": "precio",
        "Costo base": "costo"
    })

    df_detalle_venta = df_detalle_venta[["id_detalle","id_venta","id_producto","cantidad","precio","costo","cancelada","creacion","actualizacion","activo"]]
    
    return df_detalle_venta
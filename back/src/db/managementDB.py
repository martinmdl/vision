import pandas as pd
from sqlalchemy import Date, Table, MetaData, Column, Integer, String, Float, Boolean, ForeignKey, text, Date
from sqlalchemy.dialects.postgresql import insert
from src.db.engine import engine
from enum import Enum
from src.db.querys import unifyDataFrameQuery, getDBLastYearQuery, getDBProducts, getDBFeriados

metadata = MetaData()

ventas = Table(
    "ventas", metadata,
    Column("id_venta", Integer, primary_key=True),
    Column("total", Float),
    Column("tipo", String),
    Column("creacion", Date), 
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

productos = Table(
    "productos", metadata,
    Column("nombre", String, primary_key=True),
    Column("categoria", String),
    Column("cantidad", Integer),
    Column("total_ars", Float),
    Column("creacion", Date),
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

detalle_ventas = Table(
    "detalle_ventas", metadata,
    Column("id_detalle", Integer, primary_key=True),
    Column("id_venta", Integer, ForeignKey("ventas.id_venta")),
    Column("id_producto", String, ForeignKey("productos.nombre")),
    Column("cantidad", Integer),
    Column("precio", Float),
    Column("costo", Float),
    Column("cancelada", Boolean),
    Column("creacion", Date),
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

clima = Table(
    "clima", metadata,
    Column("fecha", Date, primary_key=True),
    Column("temp_avg", Float),
    Column("temp_min", Float),
    Column("temp_max", Float),
    Column("humedad", Float),
    Column("lluvia", Float),
    Column("viento", Float),
    Column("presion", Float),
    Column("nubosidad", Float),
    Column("creacion", Date),
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

tipo_feriado = Table (
    "tipo_feriado", metadata,
    Column("id_tipo_feriado", Integer, primary_key=True),
    Column("tipo", String),
    Column("creacion", Date),
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

feriado = Table (
    "feriado", metadata,
    Column("id_feriado", Integer, primary_key=True),
    Column("fecha", Date),
    Column("tipo", Integer, ForeignKey("tipo_feriado.id_tipo_feriado")), 
    Column("nombre", String),
    Column("creacion", Date),
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

class TableEnum(Enum):
    ventas = ("ventas", ventas)
    productos = ("productos", productos)
    detalle_ventas = ("detalle_ventas", detalle_ventas)
    clima = ("clima", clima)
    tipo_feriado = ("tipo_feriado", tipo_feriado)
    feriado = ("feriado", feriado)

    @classmethod
    def get_table(cls, name: str):
        for key, value in cls.__members__.items():
            if key.lower() == name.lower():
                return value.value[1]
        raise ValueError(f"Tabla '{name}' no encontrada.")

# Crear tablas si no existen

def init_db():
    metadata.create_all(engine)

def save_to_postgres(df_table, table_name, id_table):
    table = TableEnum.get_table(table_name)
    upsert_dataframe(df_table, table, id_table)

def upsert_dataframe(df, table, pk_column):
    # Inserta o ignora registros existentes según pk_column
    with engine.begin() as begin:
        for row in df.to_dict(orient="records"):
            stmt = insert(table).values(**row).on_conflict_do_nothing(
                index_elements=[pk_column]
            )
            begin.execute(stmt)

def getDBLastYear():
    with engine.connect() as conn:
        result = conn.execute(text(getDBLastYearQuery))
        last_year = result.scalar()
        return int(last_year) if last_year else None

def getDataForML():
    with engine.connect() as conn:
        result = conn.execute(text(unifyDataFrameQuery))
        return pd.DataFrame(result.fetchall(), columns=result.keys())
    
def getProducts():
    with engine.connect() as conn:
        result = conn.execute(text(getDBProducts))
        return pd.DataFrame(result.fetchall(), columns=result.keys())

def getHolidays():
    with engine.connect() as conn:
        result = conn.execute(text(getDBFeriados))
        return pd.DataFrame(result.fetchall(), columns=result.keys())
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

def upsert_dataframe(df, table, pk_column, chunk_size=1000):
    if df.empty:
        return
    
    with engine.begin() as conn:
        # Traer PKs que ya existen en la BD
        existing = pd.read_sql(
            f"SELECT {pk_column} FROM {table.name}", conn
        )
        existing_ids = set(existing[pk_column].astype(str))
        
        # Filtrar solo filas nuevas
        df_new = df[~df[pk_column].astype(str).isin(existing_ids)]
        
        if df_new.empty:
            print(f"  {table.name}: sin filas nuevas, skip")
            return
        
        print(f"  {table.name}: insertando {len(df_new)} filas nuevas de {len(df)}")
        
        for i in range(0, len(df_new), chunk_size):
            chunk = df_new.iloc[i:i + chunk_size]
            stmt = insert(table).values(chunk.to_dict(orient="records"))
            stmt = stmt.on_conflict_do_nothing(index_elements=[pk_column])
            conn.execute(stmt)

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
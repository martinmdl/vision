import pandas as pd
from sqlalchemy import Date, DateTime, Table, MetaData, Column, Integer, String, Float, Boolean, ForeignKey, text, Date, ForeignKeyConstraint
from sqlalchemy.dialects.postgresql import insert
from src.db.engine import engine
from enum import Enum
from src.db.querys import (
    unifyDataFrameQuery,
    getDBLastYearQuery,
    getDBProducts,
    getDBFeriados,
    getTopSoldProductsQuery,
    listSucursalesAllQuery,
    listSucursalesActivasQuery,
    createSucursalQuery,
    updateSucursalNombreQuery,
    updateSucursalActivoQuery,
    getSucursalLastTrainingDateQuery,
    updateSucursalLastTrainingDateQuery,
    getTopProfitableProductsQuery,
    getWeatherImpactIncomeQuery,
    getCalendarImpactIncomeQuery,
    getCalendarUpliftQuery,
    getCategoryProfitabilityQuery,
    getProcessedDataSummaryQuery,
    getProcessedDataCategoriesQuery,
    getProcessedDataRecentSalesQuery,
    getProcessedDataProductsCatalogQuery,
    getProcessedSalesByDateRangeQuery,
    getSaleDetailBySaleIdQuery,
    getTotalIncomeKpiQuery,
)

metadata = MetaData()

sucursal = Table(
    "sucursal", metadata,
    Column("id_sucursal", Integer, primary_key=True),
    Column("nombre", String),
    Column("ultima_fecha_entrenamiento", Date),
    Column("creacion", Date),
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

ventas = Table(
    "ventas", metadata,
    Column("id_venta", Integer, primary_key=True),
    Column("id_sucursal", Integer, ForeignKey("sucursal.id_sucursal"), primary_key=True),
    Column("total", Float),
    Column("tipo", String),
    Column("creacion", Date), 
    Column("actualizacion", Date),
    Column("activo", Boolean)
)

productos = Table(
    "productos", metadata,
    Column("id_producto", Integer, primary_key=True),
    Column("id_sucursal", Integer, ForeignKey("sucursal.id_sucursal"), primary_key=True),
    Column("nombre", String),
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
    Column("id_sucursal", Integer),
    Column("id_venta", Integer, primary_key=True),
    Column("id_producto", Integer),
    Column("cantidad", Integer),
    Column("precio", Float),
    Column("costo", Float),
    Column("cancelada", Boolean),
    Column("creacion", Date),
    Column("actualizacion", Date),
    Column("activo", Boolean),
    ForeignKeyConstraint(
        ["id_venta", "id_sucursal"],
        ["ventas.id_venta", "ventas.id_sucursal"]
    ),
    ForeignKeyConstraint(
        ["id_producto", "id_sucursal"],
        ["productos.id_producto", "productos.id_sucursal"]
    ),
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
    sucursal = ("sucursal", sucursal)
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
    print("Inicializando base de datos...")
    metadata.create_all(engine)

def save_to_postgres(df_table, table_name):
    table = TableEnum.get_table(table_name)
    upsert_dataframe(df_table, table)

def upsert_dataframe(df, table, chunk_size=1000):
    if df.empty:
        return

    pk_columns = [c.name for c in table.primary_key.columns]

    with engine.begin() as conn:

        print(f"  {table.name}: insertando {len(df)} filas")

        for i in range(0, len(df), chunk_size):
            chunk = df.iloc[i:i + chunk_size]

            stmt = insert(table).values(
                chunk.to_dict(orient="records")
            )

            stmt = stmt.on_conflict_do_nothing(
                index_elements=pk_columns
            )

            conn.execute(stmt)

def getDBLastYear():
    with engine.connect() as conn:
        result = conn.execute(text(getDBLastYearQuery))
        last_year = result.scalar()
        return int(last_year) if last_year else None

def getDataForML(id_sucursal: int):
    with engine.connect() as conn:
        result = conn.execute(text(unifyDataFrameQuery), {"id_sucursal": id_sucursal})
        return pd.DataFrame(result.fetchall(), columns=result.keys())
    
def getProducts(id_sucursal: int):
    with engine.connect() as conn:
        result = conn.execute(text(getDBProducts), {"id_sucursal": id_sucursal})
        return pd.DataFrame(result.fetchall(), columns=result.keys())

def getHolidays():
    with engine.connect() as conn:
        result = conn.execute(text(getDBFeriados))
        return pd.DataFrame(result.fetchall(), columns=result.keys())


def getTopSoldProducts(id_sucursal, limit=10, start_date=None, end_date=None):
    with engine.connect() as conn:
        params = {"id_sucursal": id_sucursal, "limit": limit, "start_date": start_date, "end_date": end_date}
        result = conn.execute(text(getTopSoldProductsQuery), params)
        return pd.DataFrame(result.fetchall(), columns=result.keys())


def getSucursales(all_items=False):
    query = listSucursalesAllQuery if all_items else listSucursalesActivasQuery
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [dict(row._mapping) for row in result.fetchall()]


def createSucursal(nombre):
    with engine.begin() as conn:
        result = conn.execute(text(createSucursalQuery), {"nombre": nombre})
        return result.scalar()


def updateSucursalNombre(id_sucursal, nombre):
    with engine.begin() as conn:
        conn.execute(text(updateSucursalNombreQuery), {"id": id_sucursal, "nombre": nombre})


def updateSucursalActivo(id_sucursal, activo):
    with engine.begin() as conn:
        conn.execute(text(updateSucursalActivoQuery), {"id": id_sucursal, "activo": activo})


def getSucursalLastTrainingDate(id_sucursal):
    with engine.connect() as conn:
        result = conn.execute(text(getSucursalLastTrainingDateQuery), {"id_sucursal": id_sucursal})
        return result.scalar()


def updateSucursalLastTrainingDate(id_sucursal, ultima_fecha_entrenamiento):
    with engine.begin() as conn:
        conn.execute(
            text(updateSucursalLastTrainingDateQuery),
            {
                "id_sucursal": id_sucursal,
                "ultima_fecha_entrenamiento": ultima_fecha_entrenamiento,
            },
        )
def getTopProfitableProducts(id_sucursal, limit=10, start_date=None, end_date=None):
    with engine.connect() as conn:
        params = {"id_sucursal": id_sucursal, "limit": limit, "start_date": start_date, "end_date": end_date}
        result = conn.execute(text(getTopProfitableProductsQuery), params)
        return pd.DataFrame(result.fetchall(), columns=result.keys())


def getWeatherImpactIncome(id_sucursal, start_date=None, end_date=None):
    with engine.connect() as conn:
        params = {"id_sucursal": id_sucursal, "start_date": start_date, "end_date": end_date}
        result = conn.execute(text(getWeatherImpactIncomeQuery), params)
        return pd.DataFrame(result.fetchall(), columns=result.keys())


def getCalendarImpactIncome(id_sucursal, start_date=None, end_date=None):
    with engine.connect() as conn:
        params = {"id_sucursal": id_sucursal, "start_date": start_date, "end_date": end_date}
        result = conn.execute(text(getCalendarImpactIncomeQuery), params)
        return pd.DataFrame(result.fetchall(), columns=result.keys())


def getCalendarUplift(id_sucursal, start_date=None, end_date=None):
    with engine.connect() as conn:
        params = {"id_sucursal": id_sucursal, "start_date": start_date, "end_date": end_date}
        result = conn.execute(text(getCalendarUpliftQuery), params)
        return pd.DataFrame(result.fetchall(), columns=result.keys())


def getCategoryProfitability(id_sucursal, start_date=None, end_date=None):
    with engine.connect() as conn:
        params = {"id_sucursal": id_sucursal, "start_date": start_date, "end_date": end_date}
        result = conn.execute(text(getCategoryProfitabilityQuery), params)
        return pd.DataFrame(result.fetchall(), columns=result.keys())


def getProcessedDataSummary(id_sucursal):
    with engine.connect() as conn:
        summary_row = conn.execute(
            text(getProcessedDataSummaryQuery),
            {"id_sucursal": id_sucursal},
        ).mappings().first()

        category_rows = conn.execute(
            text(getProcessedDataCategoriesQuery),
            {"id_sucursal": id_sucursal},
        ).mappings().all()

        recent_sales_rows = conn.execute(
            text(getProcessedDataRecentSalesQuery),
            {"id_sucursal": id_sucursal},
        ).mappings().all()

    return {
        "summary": dict(summary_row) if summary_row else {},
        "categories": [dict(row) for row in category_rows],
        "recent_sales": [dict(row) for row in recent_sales_rows],
    }


def getProcessedProductsCatalog(id_sucursal):
    with engine.connect() as conn:
        rows = conn.execute(
            text(getProcessedDataProductsCatalogQuery),
            {"id_sucursal": id_sucursal},
        ).mappings().all()

    return [dict(row) for row in rows]


def getProcessedSalesByDateRange(id_sucursal, start_date=None, end_date=None, limit=150):
    with engine.connect() as conn:
        rows = conn.execute(
            text(getProcessedSalesByDateRangeQuery),
            {
                "id_sucursal": id_sucursal,
                "start_date": start_date,
                "end_date": end_date,
                "limit": limit,
            },
        ).mappings().all()

    return [dict(row) for row in rows]


def getSaleDetailBySaleId(id_sucursal, id_venta):
    with engine.connect() as conn:
        rows = conn.execute(
            text(getSaleDetailBySaleIdQuery),
            {
                "id_sucursal": id_sucursal,
                "id_venta": id_venta,
            },
        ).mappings().all()

    return [dict(row) for row in rows]


def getTotalIncomeKpi(id_sucursal):
    with engine.connect() as conn:
        row = conn.execute(
            text(getTotalIncomeKpiQuery),
            {"id_sucursal": id_sucursal},
        ).mappings().first()

    return dict(row) if row else {}

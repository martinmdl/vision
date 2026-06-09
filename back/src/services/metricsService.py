from ..db.managementDB import (
    getTopSoldProducts,
    getTopProfitableProducts,
    getWeatherImpactIncome,
    getCalendarImpactIncome,
    getCalendarUplift,
    getCategoryProfitability,
    getProcessedDataSummary,
    getProcessedProductsCatalog,
    getProcessedSalesByDateRange,
    getSaleDetailBySaleId,
    getTotalIncomeKpi,
)
from datetime import date, timedelta
from typing import Optional


def parse_date_range(date_range: Optional[str]) -> Optional[str]:
    if not date_range:
        return None
    dr = date_range.lower().strip()
    today = date.today()
    if dr in ("7d", "7", "7days", "7_day"):
        start = today - timedelta(days=7)
    elif dr in ("30d", "30", "30days", "month", "1m"):
        start = today - timedelta(days=30)
    elif dr in ("90d", "90", "90days", "3m"):
        start = today - timedelta(days=90)
    elif dr in ("all", "0", "none"):
        return None
    else:
        # try parsing YYYY-MM-DD
        try:
            start = date.fromisoformat(dr)
        except Exception:
            return None
    return start.isoformat()


async def get_top_sold_products(id_sucursal, limit=10, start_date: Optional[str] = None, end_date: Optional[str] = None, date_range: Optional[str] = None):
    sd = start_date or parse_date_range(date_range)
    ed = end_date
    df_top = getTopSoldProducts(id_sucursal, limit, sd, ed)

    top_products = []
    for _, row in df_top.iterrows():
        top_products.append({
            "name": row["nombre"],
            "demand": int(row["total_vendido"] or 0),
        })

    return top_products


async def get_top_profitable_products(id_sucursal, limit=10, start_date: Optional[str] = None, end_date: Optional[str] = None, date_range: Optional[str] = None):
    sd = start_date or parse_date_range(date_range)
    ed = end_date
    df_top = getTopProfitableProducts(id_sucursal, limit, sd, ed)

    top_products = []
    for _, row in df_top.iterrows():
        top_products.append({
            "name": row["nombre"],
            "profit": float(row["total_ganancia"] or 0),
        })

    return top_products


async def get_weather_impact_income(id_sucursal, start_date: Optional[str] = None, end_date: Optional[str] = None, date_range: Optional[str] = None):
    sd = start_date or parse_date_range(date_range)
    ed = end_date
    df_weather = getWeatherImpactIncome(id_sucursal, sd, ed)

    weather_impact = []
    for _, row in df_weather.iterrows():
        weather_impact.append({
            "month": row["mes"],
            "rainy_income": float(row["ingreso_lluvioso"] or 0),
            "clear_income": float(row["ingreso_despejado"] or 0),
        })

    return weather_impact


async def get_calendar_impact_income(id_sucursal, start_date: Optional[str] = None, end_date: Optional[str] = None, date_range: Optional[str] = None):
    sd = start_date or parse_date_range(date_range)
    ed = end_date
    df_calendar = getCalendarImpactIncome(id_sucursal, sd, ed)

    calendar_impact = []
    for _, row in df_calendar.iterrows():
        calendar_impact.append({
            "month": row["mes"],
            "festive_income": float(row["ingreso_festivo"] or 0),
            "normal_income": float(row["ingreso_normal"] or 0),
            "weekend_income": float(row["ingreso_fin_semana"] or 0),
        })

    return calendar_impact


async def get_calendar_uplift(id_sucursal, start_date: Optional[str] = None, end_date: Optional[str] = None, date_range: Optional[str] = None):
    sd = start_date or parse_date_range(date_range)
    ed = end_date
    df_uplift = getCalendarUplift(id_sucursal, sd, ed)
    if df_uplift.empty:
        return {
            "holiday_uplift": 0.0,
            "weekend_uplift": 0.0,
        }

    row = df_uplift.iloc[0]
    return {
        "holiday_uplift": float(row["incremento_feriado"] or 0),
        "weekend_uplift": float(row["incremento_fin_semana"] or 0),
    }


async def get_category_profitability(id_sucursal, start_date: Optional[str] = None, end_date: Optional[str] = None, date_range: Optional[str] = None):
    sd = start_date or parse_date_range(date_range)
    ed = end_date
    df_category = getCategoryProfitability(id_sucursal, sd, ed)

    profitability = []
    for _, row in df_category.iterrows():
        profitability.append({
            "name": row["categoria"],
            "profit": float(row["total_ganancia"] or 0),
        })

    return profitability


async def get_processed_data_summary(id_sucursal):
    payload = getProcessedDataSummary(id_sucursal)

    summary = payload.get("summary", {})
    categories = payload.get("categories", [])
    recent_sales = payload.get("recent_sales", [])

    first_sale_date = summary.get("first_sale_date")
    last_sale_date = summary.get("last_sale_date")

    overview = {
        "sales_rows": int(summary.get("sales_rows") or 0),
        "products_rows": int(summary.get("products_rows") or 0),
        "sale_detail_rows": int(summary.get("sale_detail_rows") or 0),
        "sales_days": int(summary.get("sales_days") or 0),
        "total_income": float(summary.get("total_income") or 0),
        "first_sale_date": first_sale_date.isoformat() if first_sale_date else None,
        "last_sale_date": last_sale_date.isoformat() if last_sale_date else None,
    }

    pipeline = [
        {"source_sheet": "Ventas", "target_table": "ventas", "rows": overview["sales_rows"]},
        {"source_sheet": "Productos", "target_table": "productos", "rows": overview["products_rows"]},
        {"source_sheet": "Adiciones", "target_table": "detalle_ventas", "rows": overview["sale_detail_rows"]},
    ]

    top_categories = [
        {
            "name": row.get("category"),
            "products_count": int(row.get("products_count") or 0),
        }
        for row in categories
    ]

    sales_sample = [
        {
            "id_venta": int(row.get("id_venta") or 0),
            "sale_date": row.get("sale_date").isoformat() if row.get("sale_date") else None,
            "total": float(row.get("total") or 0),
            "sale_type": row.get("sale_type") or "-",
        }
        for row in recent_sales
    ]

    return {
        "overview": overview,
        "pipeline": pipeline,
        "top_categories": top_categories,
        "sales_sample": sales_sample,
    }


async def get_processed_products_catalog(id_sucursal):
    rows = getProcessedProductsCatalog(id_sucursal)
    return [
        {
            "id_producto": int(row.get("id_producto") or 0),
            "product_name": row.get("product_name") or "-",
            "category": row.get("category") or "Sin categoria",
        }
        for row in rows
    ]


async def get_processed_sales_table(id_sucursal, start_date=None, end_date=None):
    rows = getProcessedSalesByDateRange(id_sucursal, start_date=start_date, end_date=end_date, limit=180)
    return [
        {
            "id_venta": int(row.get("id_venta") or 0),
            "sale_date": row.get("sale_date").isoformat() if row.get("sale_date") else None,
            "total": float(row.get("total") or 0),
            "sale_type": row.get("sale_type") or "-",
        }
        for row in rows
    ]


async def get_sale_detail(id_sucursal, id_venta):
    rows = getSaleDetailBySaleId(id_sucursal, id_venta)
    return [
        {
            "id_detalle": int(row.get("id_detalle") or 0),
            "id_producto": int(row.get("id_producto") or 0),
            "product_name": row.get("product_name") or "-",
            "category": row.get("category") or "Sin categoria",
            "quantity": int(row.get("quantity") or 0),
            "unit_price": float(row.get("unit_price") or 0),
            "unit_cost": float(row.get("unit_cost") or 0),
            "cancelled": bool(row.get("cancelled") or False),
            "subtotal": float(row.get("subtotal") or 0),
            "profit": float(row.get("profit") or 0),
        }
        for row in rows
    ]


async def get_total_income_kpi(id_sucursal):
    row = getTotalIncomeKpi(id_sucursal)
    return {
        "total_income": float(row.get("total_income") or 0),
        "total_sales": int(row.get("total_sales") or 0),
        "sales_days": int(row.get("sales_days") or 0),
        "avg_daily_income": float(row.get("avg_daily_income") or 0),
    }

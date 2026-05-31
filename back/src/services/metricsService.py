from ..db.managementDB import (
    getTopSoldProducts,
    getTopProfitableProducts,
    getWeatherImpactIncome,
    getCalendarImpactIncome,
    getCalendarUplift,
    getCategoryProfitability,
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

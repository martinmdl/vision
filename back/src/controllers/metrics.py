from datetime import date
from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
import inspect
from ..services.metricsService import (
    get_top_sold_products,
    get_top_profitable_products,
    get_weather_impact_income,
    get_calendar_impact_income,
    get_calendar_uplift,
    get_category_profitability,
    get_processed_data_summary,
    get_processed_products_catalog,
    get_processed_sales_table,
    get_sale_detail,
    get_total_income_kpi,
)

router = APIRouter(prefix="", tags=["Metrics"])


METRICS_MAP = {
    "top_sold": get_top_sold_products,
    "top_profitable": get_top_profitable_products,
    "weather_impact_income": get_weather_impact_income,
    "calendar_impact_income": get_calendar_impact_income,
    "calendar_uplift": get_calendar_uplift,
    "category_profitability": get_category_profitability,
    "total_income": get_total_income_kpi,
}


@router.get("/metrics")
async def fetch_metrics(
    id_sucursal: int = Query(..., ge=1),
    metrics: Optional[List[str]] = Query(None),
    limit: int = Query(default=10, ge=1, le=100),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """Fetch multiple metrics in a single call.

    Example: /metrics?id_sucursal=1&metrics=top_sold&metrics=weather_impact_income&limit=5
    """
    # if no specific metrics requested, return all available metrics
    if not metrics:
        metrics = list(METRICS_MAP.keys())

    results: Dict[str, Any] = {}
    for m in metrics:
        func = METRICS_MAP.get(m)
        if not func:
            results[m] = {"status_code": 400, "message": "Unknown metric"}
            continue
        try:
            sig = inspect.signature(func)
            params = list(sig.parameters.keys())
            # build kwargs to call the service function explicitly
            kwargs = {}
            for p in params:
                if p == 'id_sucursal':
                    kwargs[p] = id_sucursal
                elif p == 'limit':
                    kwargs[p] = limit
                elif p == 'start_date':
                    kwargs[p] = start_date
                elif p == 'end_date':
                    kwargs[p] = end_date
                elif p == 'date_range':
                    # controller doesn't receive a date_range token; pass None
                    kwargs[p] = None
                else:
                    kwargs[p] = None

            data = await func(**kwargs)
            results[m] = {"status_code": 200, "data": data}
        except Exception as e:
            results[m] = {"status_code": 500, "message": f"Error interno del servidor: {str(e)}"}

    return {"status_code": 200, "message": "Metrics fetched", "data": results}

@router.get("/metrics/processed-data-summary")
async def processed_data_summary(id_sucursal: int = Query(..., ge=1)):
    try:
        data = await get_processed_data_summary(id_sucursal)
        return {
            "status_code": 200,
            "message": "Resumen de datos procesados obtenido",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/processed-products-catalog")
async def processed_products_catalog(id_sucursal: int = Query(..., ge=1)):
    try:
        data = await get_processed_products_catalog(id_sucursal)
        return {
            "status_code": 200,
            "message": "Catalogo de productos procesados obtenido",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/processed-sales")
async def processed_sales(
    id_sucursal: int = Query(..., ge=1),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    try:
        data = await get_processed_sales_table(id_sucursal, start_date=start_date, end_date=end_date)
        return {
            "status_code": 200,
            "message": "Ventas procesadas obtenidas",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/sale-detail")
async def sale_detail(
    id_sucursal: int = Query(..., ge=1),
    id_venta: int = Query(..., ge=1),
):
    try:
        data = await get_sale_detail(id_sucursal, id_venta)
        return {
            "status_code": 200,
            "message": "Detalle de venta obtenido",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }
    try:
        data = await get_total_income_kpi(id_sucursal)
        return {
            "status_code": 200,
            "message": "KPI de ingreso total obtenido",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }
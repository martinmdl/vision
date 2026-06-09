from datetime import date
from fastapi import APIRouter, Query
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


@router.get("/metrics/top-sold")
async def top_sold_products(id_sucursal: int = Query(..., ge=1), limit: int = Query(default=10, ge=1, le=100)):
    try:
        data = await get_top_sold_products(id_sucursal, limit)
        return {
            "status_code": 200,
            "message": "Top productos vendido obtenido",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/top-profitable")
async def top_profitable_products(id_sucursal: int = Query(..., ge=1), limit: int = Query(default=10, ge=1, le=100)):
    try:
        data = await get_top_profitable_products(id_sucursal, limit)
        return {
            "status_code": 200,
            "message": "Top productos rentables obtenido",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/weather-impact-income")
async def weather_impact_income(id_sucursal: int = Query(..., ge=1)):
    try:
        data = await get_weather_impact_income(id_sucursal)
        return {
            "status_code": 200,
            "message": "Impacto de clima adverso obtenido",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/calendar-impact-income")
async def calendar_impact_income(id_sucursal: int = Query(..., ge=1)):
    try:
        data = await get_calendar_impact_income(id_sucursal)
        return {
            "status_code": 200,
            "message": "Comparativa de tipos de dia obtenida",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/calendar-uplift")
async def calendar_uplift(id_sucursal: int = Query(..., ge=1)):
    try:
        data = await get_calendar_uplift(id_sucursal)
        return {
            "status_code": 200,
            "message": "Incrementos por tipo de dia obtenidos",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.get("/metrics/category-profitability")
async def category_profitability(id_sucursal: int = Query(..., ge=1)):
    try:
        data = await get_category_profitability(id_sucursal)
        return {
            "status_code": 200,
            "message": "Rentabilidad por categoria obtenida",
            "data": data,
        }
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


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


@router.get("/metrics/total-income")
async def total_income(id_sucursal: int = Query(..., ge=1)):
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

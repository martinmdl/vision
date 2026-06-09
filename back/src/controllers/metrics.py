from fastapi import APIRouter, Query
from ..services.metricsService import (
    get_top_sold_products,
    get_top_profitable_products,
    get_weather_impact_income,
    get_calendar_impact_income,
    get_calendar_uplift,
    get_category_profitability,
    get_processed_data_summary,
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

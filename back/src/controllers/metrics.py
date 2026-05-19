from fastapi import APIRouter, Query
from ..services.metricsService import (
    get_top_sold_products,
    get_top_profitable_products,
    get_weather_impact_income,
)

router = APIRouter(prefix="", tags=["Metrics"])


@router.get("/metrics/top-sold")
async def top_sold_products(limit: int = Query(default=10, ge=1, le=100)):
    try:
        data = await get_top_sold_products(limit)
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
async def top_profitable_products(limit: int = Query(default=10, ge=1, le=100)):
    try:
        data = await get_top_profitable_products(limit)
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
async def weather_impact_income():
    try:
        data = await get_weather_impact_income()
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

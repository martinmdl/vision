from fastapi import APIRouter, Query
from ..services.metricsService import get_top_sold_products

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

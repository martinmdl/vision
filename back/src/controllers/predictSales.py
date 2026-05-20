from fastapi import APIRouter, Body
from ..services.predictSalesService import predecir_7_dias

router = APIRouter(prefix="", tags=["Predict"])

@router.post("/predict")

async def predict(id_sucursal: int = Body(..., embed=True)):
    try:
        predicciones = await predecir_7_dias(id_sucursal)
        return {
            "status_code": 200,
            "message": "Predicción completa",
            "data": predicciones.to_dict(orient="records")
        }

    except ValueError as e:
        return {
            "status_code": 400,
            "message": f"Error en los datos"
        }

    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}"
        }
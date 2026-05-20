from fastapi import APIRouter, Body
from ..services.sucursalesService import (
    list_sucursales_service,
    create_sucursal_service,
    update_sucursal_nombre_service,
    set_sucursal_activo_service,
)

router = APIRouter(prefix="", tags=["Sucursales"])

@router.get("/api/sucursales")
async def list_sucursales(all: bool = False):
    try:
        rows = await list_sucursales_service(all)
        return {"status_code": 200, "data": rows}
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.post("/api/sucursales", status_code=201)
async def create_sucursal(nombre: str = Body(..., embed=True)):
    try:
        new_id = await create_sucursal_service(nombre)
        return {"status_code": 201, "message": "Sucursal creada", "data": {"id_sucursal": new_id}}
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.put("/api/sucursales/{id}")
async def update_sucursal(id: int, nombre: str = Body(..., embed=True)):
    try:
        await update_sucursal_nombre_service(id, nombre)
        return {"status_code": 200, "message": "Sucursal actualizada"}
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }


@router.put("/api/sucursales/{id}/activo")
async def set_activo(id: int, activo: bool = Body(..., embed=True)):
    try:
        await set_sucursal_activo_service(id, activo)
        return {"status_code": 200, "message": "Estado actualizado"}
    except Exception as e:
        return {
            "status_code": 500,
            "message": f"Error interno del servidor: {str(e)}",
        }

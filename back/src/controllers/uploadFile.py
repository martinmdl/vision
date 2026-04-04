from fastapi import HTTPException, UploadFile, File, APIRouter
from ..services.uploadFileService import uploadFileService

router = APIRouter(prefix="", tags=["Upload"])

@router.post("/load")
async def upload_file(file: UploadFile = File(...)):

    # Validación de extensión
    if not (file.filename.endswith(".xls") or file.filename.endswith(".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Por favor, suba un archivo Excel (.xls o .xlsx)."
        )

    try:
        await uploadFileService(file)

        return {
            "status_code": 200,
            "message": "Datos cargados correctamente",
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"La estructura del excel no coincide con la esperada"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )
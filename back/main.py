from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.controllers.uploadFile import router as upload_router
from src.controllers.predictSales import router as predict_router

app = FastAPI()

# 👇 Configuración de CORS
origins = [
    "http://localhost:8080",  # tu frontend local
    "http://127.0.0.1:8080",  # a veces el navegador usa esta variante
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(predict_router)

@app.get("/")
def getMessage():
    return {"200": "API Running"}

@app.get("/favicon.ico")
async def favicon():
    return {"200": "Favicon"}
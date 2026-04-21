from ..db.managementDB import init_db, save_to_postgres
from ..utils.cleanBusinessData import clean_xls
from ..utils.cleanWeatherData import cleanWeather
from ..utils.holiday import getHoliday
from ..utils.weather import getWeather
from ..utils.generateML import generateML
import asyncio
import time


async def uploadFileService(file):
    
    init_db()
    
    # excel (subido por el usuario)
    df_venta, df_producto, df_detalle_venta = clean_xls(file.file)
    
    t0 = time.time()
    # Guardar en BD (upsert para no duplicar)
    print(f"  ventas: {len(df_venta)} filas")
    print(f"  productos: {len(df_producto)} filas")
    print(f"  detalles: {len(df_detalle_venta)} filas")
    save_to_postgres(df_venta, "ventas", "id_venta")
    save_to_postgres(df_producto, "productos", "nombre")
    save_to_postgres(df_detalle_venta, "detalle_ventas", "id_detalle")
    print(f"[1] clean + save BD: {time.time() - t0:.2f}s")
    
    t1 = time.time()
    # clima (consultar API: https://data.meteostat.net/daily/<AÑOS>/87585.csv.gz)
    # feriados (consultar API: https://api.argentinadatos.com/v1/feriados/<AÑOS>)
    (df_clima_api, result_holiday) = await asyncio.gather(
        asyncio.to_thread(getWeather, df_venta),
        asyncio.to_thread(getHoliday, df_venta)
    )
    df_clima = cleanWeather(df_clima_api)
    df_feriado, df_catalog = result_holiday
    print(f"[2] APIs clima + feriados (paralelo): {time.time() - t1:.2f}s")

    t2 = time.time()
    save_to_postgres(df_clima, "clima", "fecha")
    save_to_postgres(df_catalog, "tipo_feriado", "id_tipo_feriado") 
    save_to_postgres(df_feriado, "feriado", "id_feriado")
    print(f"[3] save clima/feriados: {time.time() - t2:.2f}s")

    # machine learning PKL
    t3 = time.time()
    generateML()
    print(f"[4] generateML: {time.time() - t3:.2f}s")
    print(f"[TOTAL]: {time.time() - t0:.2f}s")
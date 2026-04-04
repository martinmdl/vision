from ..db.managementDB import init_db, save_to_postgres
from ..utils.cleanBusinessData import clean_xls
from ..utils.cleanWeatherData import cleanWeather
from ..utils.holiday import getHoliday
from ..utils.weather import getWeather
from ..utils.generateML import generateML


async def uploadFileService(file):
    
    init_db()
    
    # excel (subido por el usuario)
    df_venta, df_producto, df_detalle_venta = clean_xls(file.file)
    
    # Guardar en BD (upsert para no duplicar)
    save_to_postgres(df_venta, "ventas", "id_venta")
    save_to_postgres(df_producto, "productos", "nombre")
    save_to_postgres(df_detalle_venta, "detalle_ventas", "id_detalle")

    # clima (consultar API: https://data.meteostat.net/daily/<AÑOS>/87585.csv.gz)
    df_clima_api = await getWeather(df_venta)
    df_clima = cleanWeather(df_clima_api)
    save_to_postgres(df_clima, "clima", "fecha")

    # feriados (consultar API: https://api.argentinadatos.com/v1/feriados/<AÑOS>)
    df_feriado, df_catalog = await getHoliday(df_venta)
    save_to_postgres(df_catalog, "tipo_feriado", "id_tipo_feriado") 
    save_to_postgres(df_feriado, "feriado", "id_feriado")

    # machine learning PKL
    generateML()
import pandas as pd
import requests
from io import BytesIO
import gzip
from ..db.managementDB import getDBLastYear

# API para uploadFile
def getWeather(df_venta):
    firstYear, lastYear = getYears(df_venta)
    dbLastYear = getDBLastYear()

    if dbLastYear:
        firstYear = min(dbLastYear + 1, lastYear)
    
    yearsToFetch = range(firstYear, lastYear + 1)

    df_list = []

    for year in yearsToFetch:
        # Fetch archivo.csv clima
        weather_info = requests.get(f"https://data.meteostat.net/daily/{year}/87585.csv.gz")
        if weather_info.status_code != 200:
            return {"error": f"No se pudo descargar el archivo para el año {year}"}
        # Leer CSV comprimido directamente
        with gzip.open(BytesIO(weather_info.content), "rt") as f:
            df_clima = pd.read_csv(f)
        df_list.append(df_clima)

    df_clima = pd.concat(df_list, ignore_index=True)
    
    return df_clima


# Del ultimo archivo subido por el usuario
def getYears(df_venta):
    firstYear = df_venta['creacion'].min().date().year
    lastYear = df_venta['creacion'].max().date().year

    return firstYear, lastYear


# API predictSales
async def obtener_clima_proximos_dias():
    base_url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": -34.593186,
        "longitude": -58.495826,
        "timezone": "auto",
        "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,rain_sum,cloud_cover_mean,wind_speed_10m_mean,surface_pressure_mean",
        "forecast_days": 7
    }

    r = requests.get(base_url, params=params)
    r.raise_for_status()
    data = r.json()

    df_clima_futuro= pd.DataFrame({
        "fecha": data["daily"]["time"],
        "temp_avg": data["daily"]["temperature_2m_mean"],
        "temp_min": data["daily"]["temperature_2m_min"],
        "temp_max": data["daily"]["temperature_2m_max"],
        "humedad": data["daily"]["relative_humidity_2m_mean"],
        "lluvia": data["daily"]["rain_sum"],
        "viento": data["daily"]["wind_speed_10m_mean"],
        "presion": data["daily"]["surface_pressure_mean"],
        "nubosidad": data["daily"]["cloud_cover_mean"]
    })

    df_clima_futuro["fecha"] = pd.to_datetime(df_clima_futuro["fecha"])
    #df_clima_futuro = df_clima_futuro.iloc[1:] 
    return df_clima_futuro
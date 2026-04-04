from catboost import CatBoostRegressor
import requests
import pandas as pd
from ..db.managementDB import getDataForML, getHolidays, getProducts
from ..utils.weather import obtener_clima_proximos_dias

async def predecir_7_dias():

    model = CatBoostRegressor()
    model.load_model("src/model/catboost_model.cbm") 

    df_products = getProducts()
    features = [
        "nombre", "temp_avg", "temp_min", "temp_max", "humedad", "lluvia", "viento", "presion", "nubosidad", "feriado", "tipo_feriado", "dia_semana", "mes"
    ]
    df_forecast = await obtener_clima_proximos_dias()
    df_forecast["fecha"] = pd.to_datetime(df_forecast["fecha"])
    df_holiday = getHolidays()
    predicciones = []

    for _, clima_row in df_forecast.iterrows():
        for _, product_row in df_products.iterrows():
            [nombre, tipo_feriado] = buscar_feriado(clima_row["fecha"], df_holiday)
            
            fila = {
                "nombre": product_row["nombre"],
                "temp_avg": clima_row["temp_avg"],
                "temp_min": clima_row["temp_min"],
                "temp_max": clima_row["temp_max"],
                "humedad": clima_row["humedad"],
                "lluvia": clima_row["lluvia"],
                "viento": clima_row["viento"],
                "presion": clima_row["presion"],
                "nubosidad": clima_row["nubosidad"],
                "tipo_feriado": tipo_feriado,                 
                "feriado": nombre,                              
                "dia_semana": clima_row["fecha"].dayofweek,
                "mes": clima_row["fecha"].month
            }
            X_pred = pd.DataFrame([fila])[features]
            y_pred = model.predict(X_pred)[0]

            predicciones.append({
                "nombre": product_row["nombre"],
                "fecha_prediccion": clima_row["fecha"],
                "pred_cantidad": max(0, y_pred)  # Evita negativos
            })

    return pd.DataFrame(predicciones)

def buscar_feriado(fecha, df_holidays):
    for _, feriado in df_holidays.iterrows():
        if feriado["fecha"] == fecha:
            return [feriado["nombre"], feriado["tipo_feriado"]]
    return [0,0]
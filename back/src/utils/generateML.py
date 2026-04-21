from ..db.managementDB import getDataForML
from catboost import CatBoostRegressor, Pool
from sklearn.metrics import mean_absolute_error, mean_squared_error
import pandas as pd
import numpy as np
import os

LAST_TRAINED_PATH = "src/model/last_trained_date.txt"

def getLastTrainedDate():
    if not os.path.exists(LAST_TRAINED_PATH):
        return None
    with open(LAST_TRAINED_PATH) as f:
        return f.read().strip()

def saveLastTrainedDate(date):
    os.makedirs("src/model", exist_ok=True)
    with open(LAST_TRAINED_PATH, "w") as f:
        f.write(str(date))

# sobreescribir predictSales.pkl
def generateML():

    df = getDataForML()

    # Crear features de fecha
    df["creacion"] = pd.to_datetime(df["creacion"])

    last_trained_date = getLastTrainedDate()
    model_exists = os.path.exists("src/model/catboost_model.cbm")

    # Si hay un modelo previo y una fecha de último entrenamiento, hacer entrenamiento incremental
    if last_trained_date and model_exists:
        df_train = df[df["creacion"] > pd.to_datetime(last_trained_date)]
        if df_train.empty:
            print("Sin datos nuevos, se omite el reentrenamiento.")
            return
    
        # CAMBIO: iterations proporcional al % de datos nuevos
        pct_nuevos = len(df_train) / len(df)
        iterations = max(200, int(1000 * pct_nuevos))
        print(f"Entrenamiento incremental con {len(df_train)} filas nuevas ({pct_nuevos:.0%}) → {iterations} iteraciones.")
    else:
        print("Primera carga, entrenamiento completo.")
        df_train = df
        iterations = 1000

    df_train = df_train.copy()
    df_train["dia_semana"] = df_train["creacion"].dt.dayofweek
    df_train["mes"] = df_train["creacion"].dt.month

    # Definir Target y Features
    y = df_train["cantidad_vendida"]
    X = df_train.drop(columns=["cantidad_vendida", "creacion"]) 

    # Columnas categóricas
    cat_cols = ["nombre", "feriado", "tipo_feriado"]

    # Train / test simple
    X_train = X[:-30] if len(X) > 30 else X
    X_test = X[-30:] if len(X) > 30 else X
    y_train = y[:-30] if len(y) > 30 else y
    y_test = y[-30:] if len(y) > 30 else y

    # Entrenar y Guardar
    train_pool = Pool(X_train, y_train, cat_features=cat_cols)
    model = CatBoostRegressor(
        iterations=iterations,
        depth=6,
        learning_rate=0.05,
        loss_function="RMSE",
        eval_metric="RMSE",
        random_seed=42,
        early_stopping_rounds=50,
        verbose=100
    )

    # Si existe modelo previo, continuar desde él con init_model
    if last_trained_date and model_exists:
        prev_model = CatBoostRegressor()
        prev_model.load_model("src/model/catboost_model.cbm")
        model.fit(train_pool, init_model=prev_model)
    else:
        model.fit(train_pool)

    os.makedirs("src/model", exist_ok=True)
    model.save_model("src/model/catboost_model.cbm")
    saveLastTrainedDate(df_train["creacion"].max())

    # Predecir y evaluar
    test_pool = Pool(X_test, cat_features=cat_cols)
    pred = model.predict(test_pool)
    mae = mean_absolute_error(y_test, pred) # TODO: mejorar metricas 
    rmse = np.sqrt(mean_squared_error(y_test, pred))

    print("Predicciones: ",pred)
    print("MAE: ", mae)
    print("RMSE: ", rmse)

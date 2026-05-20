from ..db.managementDB import getDataForML, getSucursalLastTrainingDate, updateSucursalLastTrainingDate
from catboost import CatBoostRegressor, Pool
from sklearn.metrics import mean_absolute_error, mean_squared_error
import pandas as pd
import numpy as np
import os

MODEL_DIR = "src/model"


def getModelPath(id_sucursal: int):
    return os.path.join(MODEL_DIR, f"catboost_model_{id_sucursal}.cbm")

# sobreescribir predictSales.pkl
def generateML(id_sucursal: int):

    df = getDataForML(id_sucursal)

    if df.empty:
        print(f"Sucursal {id_sucursal}: sin datos para entrenar.")
        return

    # Crear features de fecha
    df["creacion"] = pd.to_datetime(df["creacion"])

    last_trained_date = getSucursalLastTrainingDate(id_sucursal)
    model_path = getModelPath(id_sucursal)
    model_exists = os.path.exists(model_path)

    # Si hay un modelo previo y una fecha de último entrenamiento, hacer entrenamiento incremental
    if last_trained_date and model_exists:
        last_trained_date = pd.to_datetime(last_trained_date).date()
        df_train = df[df["creacion"].dt.date > last_trained_date]
        if df_train.empty:
            print(f"Sucursal {id_sucursal}: sin datos nuevos, se omite el reentrenamiento.")
            return
    
        # CAMBIO: iterations proporcional al % de datos nuevos
        pct_nuevos = len(df_train) / len(df)
        iterations = max(200, int(1000 * pct_nuevos))
        print(f"Sucursal {id_sucursal}: entrenamiento incremental con {len(df_train)} filas nuevas ({pct_nuevos:.0%}) → {iterations} iteraciones.")
    else:
        print(f"Sucursal {id_sucursal}: primera carga, entrenamiento completo.")
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
        prev_model.load_model(model_path)
        model.fit(train_pool, init_model=prev_model)
    else:
        model.fit(train_pool)

    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save_model(model_path)
    updateSucursalLastTrainingDate(id_sucursal, df_train["creacion"].max().date())

    # Predecir y evaluar
    test_pool = Pool(X_test, cat_features=cat_cols)
    pred = model.predict(test_pool)
    mae = mean_absolute_error(y_test, pred) # TODO: mejorar metricas 
    rmse = np.sqrt(mean_squared_error(y_test, pred))

    print("Predicciones: ",pred)
    print("MAE: ", mae)
    print("RMSE: ", rmse)

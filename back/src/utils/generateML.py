from ..db.managementDB import getDataForML
from catboost import CatBoostRegressor, Pool
from sklearn.metrics import mean_absolute_error, mean_squared_error
import pandas as pd
import numpy as np
import os
import json

MODEL_PATH = "src/model/catboost_model.cbm"
TRAINING_STATE_PATH = "src/model/training_state.json"
MODEL_SCHEMA_PATH = "src/model/model_schema.txt"
CURRENT_MODEL_SCHEMA = "global_v2_id_sucursal"


def getTrainingState():
    if not os.path.exists(TRAINING_STATE_PATH):
        return {}
    with open(TRAINING_STATE_PATH) as f:
        try:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}


def saveTrainingState(state):
    os.makedirs("src/model", exist_ok=True)
    with open(TRAINING_STATE_PATH, "w") as f:
        json.dump(state, f)


def getLastTrainedDate(id_sucursal):
    state = getTrainingState()
    return state.get(str(id_sucursal))


def saveLastTrainedDate(id_sucursal, date):
    state = getTrainingState()
    state[str(id_sucursal)] = str(date)
    saveTrainingState(state)


def getModelSchema():
    if not os.path.exists(MODEL_SCHEMA_PATH):
        return None
    with open(MODEL_SCHEMA_PATH) as f:
        return f.read().strip()


def saveModelSchema(schema):
    os.makedirs("src/model", exist_ok=True)
    with open(MODEL_SCHEMA_PATH, "w") as f:
        f.write(str(schema))


# sobreescribir predictSales.pkl
def generateML(id_sucursal=None):
    df = getDataForML()

    if df.empty:
        print("Sin datos para entrenar.")
        return

    df["creacion"] = pd.to_datetime(df["creacion"])
    df["id_sucursal"] = df["id_sucursal"].astype(str)

    model_exists = os.path.exists(MODEL_PATH)
    schema_matches = getModelSchema() == CURRENT_MODEL_SCHEMA

    # Cuando el esquema cambie, reentrenamos completo con todos los datos.
    if not model_exists or not schema_matches:
        print("Entrenamiento completo por primer modelo o cambio de esquema.")
        df_train = df
        iterations = 1000
        use_incremental = False
    else:
        use_incremental = True

        if id_sucursal is not None:
            df = df[df["id_sucursal"] == str(id_sucursal)].copy()

        if df.empty:
            print("Sin datos para la sucursal indicada, se omite el reentrenamiento.")
            return

        if id_sucursal is not None:
            last_trained_date = getLastTrainedDate(id_sucursal)
            if last_trained_date:
                df_train = df[df["creacion"] > pd.to_datetime(last_trained_date)].copy()
                if df_train.empty:
                    print(f"Sin datos nuevos para la sucursal {id_sucursal}, se omite el reentrenamiento.")
                    return
                pct_nuevos = len(df_train) / len(df)
                iterations = max(200, int(1000 * pct_nuevos))
                print(
                    f"Entrenamiento incremental para sucursal {id_sucursal} con {len(df_train)} filas nuevas "
                    f"({pct_nuevos:.0%}) → {iterations} iteraciones."
                )
            else:
                df_train = df
                iterations = 1000
                print(f"Primera carga para sucursal {id_sucursal}, entrenamiento completo de la sucursal.")
        else:
            df_train = df
            iterations = 1000
            print("Entrenamiento completo global.")

    df_train = df_train.copy()
    df_train["dia_semana"] = df_train["creacion"].dt.dayofweek
    df_train["mes"] = df_train["creacion"].dt.month

    y = df_train["cantidad_vendida"]
    X = df_train.drop(columns=["cantidad_vendida", "creacion"])

    cat_cols = ["id_sucursal", "nombre", "feriado", "tipo_feriado"]

    X_train = X[:-30] if len(X) > 30 else X
    X_test = X[-30:] if len(X) > 30 else X
    y_train = y[:-30] if len(y) > 30 else y
    y_test = y[-30:] if len(y) > 30 else y

    train_pool = Pool(X_train, y_train, cat_features=cat_cols)
    model = CatBoostRegressor(
        iterations=iterations,
        depth=6,
        learning_rate=0.05,
        loss_function="RMSE",
        eval_metric="RMSE",
        random_seed=42,
        early_stopping_rounds=50,
        verbose=100,
    )

    if use_incremental and model_exists and X_train.shape[0] > 0:
        try:
            prev_model = CatBoostRegressor()
            prev_model.load_model(MODEL_PATH)
            model.fit(train_pool, init_model=prev_model)
        except Exception as e:
            print(f"No se pudo continuar incrementalmente, se reentrena completo: {str(e)}")
            model.fit(train_pool)
    else:
        model.fit(train_pool)

    os.makedirs("src/model", exist_ok=True)
    model.save_model(MODEL_PATH)
    saveModelSchema(CURRENT_MODEL_SCHEMA)

    if id_sucursal is not None:
        saveLastTrainedDate(id_sucursal, df_train["creacion"].max())
    else:
        state = getTrainingState()
        for branch_id, branch_df in df_train.groupby("id_sucursal"):
            state[str(branch_id)] = str(branch_df["creacion"].max())
        saveTrainingState(state)

    if len(X_test) > 0:
        test_pool = Pool(X_test, cat_features=cat_cols)
        pred = model.predict(test_pool)
        mae = mean_absolute_error(y_test, pred)
        rmse = np.sqrt(mean_squared_error(y_test, pred))

        print("Predicciones: ", pred)
        print("MAE: ", mae)
        print("RMSE: ", rmse)

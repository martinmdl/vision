import pandas as pd
import requests
import json
from difflib import get_close_matches

OLLAMA_URL = "http://ollama:11434/api/generate"
MODELO = "llama3.2:3b"  

def extraer_datos_completos(path):
    xls = pd.ExcelFile(path)
    resultado = {}
    for sheet in xls.sheet_names:
        df_preview = pd.read_excel(path, sheet_name=sheet, header=None, nrows=10)
        mejor_fila = 0
        mejor_score = -1
        for i in range(len(df_preview)):
            score = sum(isinstance(val, str) and str(val).strip() != "" for val in df_preview.iloc[i])
            if score > mejor_score:
                mejor_score = score
                mejor_fila = i
        
        df_full = pd.read_excel(path, sheet_name=sheet, header=mejor_fila, nrows=5)
        columnas = [str(col) for col in df_full.columns if "Unnamed" not in str(col)][:15]
        muestra_texto = df_full.iloc[:, :15].to_string(index=False)
        
        resultado[sheet] = {
            "columnas": columnas,
            "muestra": muestra_texto,
            "header_row": mejor_fila
        }
    return resultado

def elegir_sheet_adecuada(data_completa, nombre_tabla, campos_db, excluir):
    contexto_hojas = ""
    for nombre, contenido in data_completa.items():
        if nombre in excluir: continue
        contexto_hojas += f"SHEET: {nombre}\nCOLS: {contenido['columnas']}\n\n"

    prompt = f"""[TASK] Pick the best sheet for SQL table '{nombre_tabla}'.
[EXCLUDE]: {excluir}
[DATA]:
{contexto_hojas}
[RULE]: Respond ONLY with the sheet name."""

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODELO, "prompt": prompt, "stream": False, 
            "options": {"temperature": 0, "num_predict": 20}
        }, timeout=30)
        res_text = response.json().get('response', "").strip().replace('"', '')
        
        for hoja in data_completa.keys():
            if hoja.lower() in res_text.lower() and hoja not in excluir:
                return hoja
        return [h for h in data_completa.keys() if h not in excluir][0]
    except:
        return [h for h in data_completa.keys() if h not in excluir][0]

def consultar_ollama(info_hoja, nombre_tabla, campos_db):
    columnas_disponibles = info_hoja["columnas"]

    # Pre-paso: match exacto case-insensitive antes de llamar a ollama
    mapeo_previo = {}
    campos_para_ollama = []

    for campo in campos_db:
        match = next((col for col in columnas_disponibles if col.lower() == campo.lower()), None)
        if match:
            mapeo_previo[campo] = match
            print(f"  [exacto] '{campo}' -> '{match}'")
        else:
            campos_para_ollama.append(campo)

    # Si ya están todos mapeados, ni consultar ollama
    if not campos_para_ollama:
        return mapeo_previo

    # Solo mandar a ollama los campos que no tuvieron match exacto
    formato_esperado = {campo: "Column_Name" for campo in campos_para_ollama}

    prompt = f"""[TABLE: {nombre_tabla}]
[COLS: {columnas_disponibles}]
[SAMPLE: {info_hoja['muestra']}]
[FIELDS: {campos_para_ollama}]

[TASK]
Map each SQL field to EXACTLY ONE Excel column.

[STRICT RULES]
1. Respond with a SINGLE string per field. NO LISTS, NO ARRAYS.
2. If multiple columns seem correct, pick the one that fits best.
3. Every field in {campos_para_ollama} must have a value from [COLS] or null.
4. Format: {json.dumps(formato_esperado)}

[FORMAT]
Return ONLY JSON."""

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODELO,
            "format": "json",
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0}
        }, timeout=60)

        raw_res = response.json().get('response', "{}")
        mapeo_ollama = json.loads(raw_res)

        for k, v in mapeo_ollama.items():
            if isinstance(v, list):
                mapeo_ollama[k] = v[0] if v else None

    except:
        mapeo_ollama = {campo: None for campo in campos_para_ollama}

    # Fallback similaridad para los que ollama dejó en null
    for campo, valor in mapeo_ollama.items():
        if valor is None:
            matches = get_close_matches(campo, columnas_disponibles, n=1, cutoff=0.4)
            if matches:
                mapeo_ollama[campo] = matches[0]
                print(f"  [fallback difflib] '{campo}' -> '{matches[0]}'")

    # Merge: exactos + ollama
    mapeo_final = {**mapeo_previo, **mapeo_ollama}

    # Validar que no quedaron campos sin mapear
    campos_nulos = [c for c, v in mapeo_final.items() if v is None]
    if campos_nulos:
        raise ValueError()

    return mapeo_final
    
def scanExcel(file_obj):
    print(f"Usando {MODELO} para procesar el archivo subido...")
    data = extraer_datos_completos(file_obj)
    
    tablas_objetivo = [
        {"tabla": "VENTAS",         "campos": ["id_venta", "total", "tipo", "creacion"]},
        {"tabla": "DETALLE_VENTAS", "campos": ["id_venta", "producto", "cantidad", "precio", "costo", "cancelada"]},
        {"tabla": "PRODUCTOS",      "campos": ["nombre", "categoria", "cantidad", "total_ars"]}
    ]

    mapeo_final = {}
    hojas_ya_usadas = []

    for item in tablas_objetivo:
        tabla = item["tabla"]
        print(f"--- Analizando {tabla} ---")
        
        hoja_elegida = elegir_sheet_adecuada(data, tabla, item["campos"], hojas_ya_usadas)
        print(f"Hoja: {hoja_elegida}")
        hojas_ya_usadas.append(hoja_elegida)
        
        mapeo = consultar_ollama(data[hoja_elegida], tabla, item["campos"])
        mapeo_final[tabla] = {
            "sheet": hoja_elegida,
            "header_row": data[hoja_elegida]["header_row"],
            "mapeo": mapeo
        }

    print("\n" + "="*30 + "\nRESULTADO FINAL\n" + "="*30)
    print(json.dumps(mapeo_final, indent=4, ensure_ascii=False))

    return mapeo_final
import calendar
import pandas as pd
import requests
from .weather import getYears
from ..db.managementDB import getDBLastYear

def getHoliday(df_venta):
    firstYear, lastYear = getYears(df_venta)
    dbLastYear = getDBLastYear()

    if dbLastYear:
        firstYear = min(dbLastYear + 1, lastYear)
    
    yearsToFetch = range(firstYear, lastYear + 1)

    df_list = []
    df_catalog = buildTypesCatalog()
    
    for year in yearsToFetch:
        # Fetch archivo.csv holiday
        holiday_info = requests.get(f"https://api.argentinadatos.com/v1/feriados/{year}")
        if holiday_info.status_code != 200:
            return {"error": f"No se pudo descargar el archivo para el año {year}"}
        df_holiday = pd.DataFrame(holiday_info.json())

        df_holiday = insertAnniversaries(df_holiday, year)

        df_holiday = cleanHolidays(df_holiday, df_catalog)

        df_list.append(df_holiday)

    df_holiday = pd.concat(df_list, ignore_index=True)
    
    return [df_holiday, df_catalog]


def buildTypesCatalog():
    data = {
        "id_tipo_feriado": [1, 2, 3, 4, 5],
        "tipo": ["inamovible", "puente", "trasladable", "no laborable", "efemeride"],
    }
    df_catalog = pd.DataFrame(data)
    df_catalog["creacion"] = pd.Timestamp.now().replace(microsecond=0)
    df_catalog["actualizacion"] = df_catalog["creacion"]
    df_catalog["activo"] = True
    return df_catalog

def cleanHolidays(df_holiday, df_catalog):
    df_holiday["tipo"] = df_holiday["tipo"].map(df_catalog.set_index("tipo")["id_tipo_feriado"])
    df_holiday["fecha"] = pd.to_datetime(df_holiday["fecha"])
    df_holiday["id_feriado"] = range(1, len(df_holiday) + 1)
    df_holiday["creacion"] = pd.Timestamp.now().replace(microsecond=0)
    df_holiday["actualizacion"] = df_holiday["creacion"]
    df_holiday["activo"] = True
    df_holiday = df_holiday [["id_feriado", "fecha", "tipo", "nombre", "creacion", "actualizacion", "activo"]]

    return df_holiday
    
def insertAnniversaries(df_holiday, year):
    
    df_anniversaries = pd.DataFrame([
        {
            "fecha": holyThursday(df_holiday),
            "tipo": "no laborable",
            "nombre": "Jueves Santo"
        },
        {
            "fecha": thirdSunday(year, 6),
            "tipo": "efemeride",
            "nombre": "Día del Padre"
        },
        {
            "fecha": f"{year}-07-20",
            "tipo": "efemeride",
            "nombre": "Día del amigo"
        },
        {
            "fecha": thirdSunday(year, 8),
            "tipo": "efemeride",
            "nombre": "Día del Niño"
        },
        {
            "fecha": f"{year}-09-21",          
            "tipo": "efemeride",            
            "nombre": "Día del Estudiante/Primavera",            
        },
        {
            "fecha": thirdSunday(year, 10),
            "tipo": "efemeride",
            "nombre": "Día de la Madre"
        },
    ])

    df_holiday = pd.concat([df_holiday, df_anniversaries], ignore_index=True)

    return df_holiday

def thirdSunday(year, month):
    c = calendar.Calendar()
    sundays = [d for d in c.itermonthdates(year, month) if d.weekday() == 6 and d.month == month]
    return sundays[2]

def holyThursday(df_holiday):
    holy_friday = df_holiday.loc[df_holiday["nombre"].str.lower() == "viernes santo", "fecha"].iloc[0]
    holy_friday = pd.to_datetime(holy_friday)
    holy_thursday = (holy_friday - pd.Timedelta(days=1))
    holy_thursday = holy_thursday.strftime('%Y-%m-%d')
    return holy_thursday

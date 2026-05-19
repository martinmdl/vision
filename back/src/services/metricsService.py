from ..db.managementDB import getTopSoldProducts, getTopProfitableProducts, getWeatherImpactIncome


async def get_top_sold_products(limit=10):
    df_top = getTopSoldProducts(limit)

    top_products = []
    for _, row in df_top.iterrows():
        top_products.append({
            "name": row["nombre"],
            "demand": int(row["total_vendido"] or 0),
        })

    return top_products


async def get_top_profitable_products(limit=10):
    df_top = getTopProfitableProducts(limit)

    top_products = []
    for _, row in df_top.iterrows():
        top_products.append({
            "name": row["nombre"],
            "profit": float(row["total_ganancia"] or 0),
        })

    return top_products


async def get_weather_impact_income():
    df_weather = getWeatherImpactIncome()

    weather_impact = []
    for _, row in df_weather.iterrows():
        weather_impact.append({
            "month": row["mes"],
            "rainy_income": float(row["ingreso_lluvioso"] or 0),
            "clear_income": float(row["ingreso_despejado"] or 0),
        })

    return weather_impact

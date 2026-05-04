from ..db.managementDB import getTopSoldProducts


async def get_top_sold_products(limit=10):
    df_top = getTopSoldProducts(limit)

    top_products = []
    for _, row in df_top.iterrows():
        top_products.append({
            "name": row["nombre"],
            "demand": int(row["total_vendido"] or 0),
        })

    return top_products

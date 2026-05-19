from ..db.managementDB import (
    getSucursales,
    createSucursal,
    updateSucursalNombre,
    updateSucursalActivo,
)


async def list_sucursales_service(all_items=False):
    return getSucursales(all_items)


async def create_sucursal_service(nombre):
    return createSucursal(nombre)


async def update_sucursal_nombre_service(id_sucursal, nombre):
    updateSucursalNombre(id_sucursal, nombre)


async def set_sucursal_activo_service(id_sucursal, activo):
    updateSucursalActivo(id_sucursal, activo)

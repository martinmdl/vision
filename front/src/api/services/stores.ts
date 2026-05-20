const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export interface StoreItem {
  id_sucursal: number;
  nombre: string;
  activo: boolean;
}

export async function listStores(all = false): Promise<StoreItem[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sucursales?all=${all}`)
    const json = await res.json()
    return Array.isArray(json.data) ? json.data : null
  } catch (e) {
    return null
  }
}

export async function createStore(nombre: string): Promise<{ id_sucursal?: number } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sucursales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    const json = await res.json()
    return json.data ?? null
  } catch (e) {
    return null
  }
}

export async function updateStoreName(id: number, nombre: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sucursales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    return res.ok
  } catch (e) {
    return false
  }
}

export async function setStoreActivo(id: number, activo: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sucursales/${id}/activo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    })
    return res.ok
  } catch (e) {
    return false
  }
}

import { useState, useCallback, useEffect } from 'react';
import type { Store, Metric, ViewMode, GridColumns, DateRange } from '@/types/store';
import { listStores, createStore, updateStoreName, setStoreActivo } from '@/api/services/stores';

const SAMPLE_DATA = [
  { name: 'Lun', value: 420 },
  { name: 'Mar', value: 380 },
  { name: 'Mie', value: 510 },
  { name: 'Jue', value: 470 },
  { name: 'Vie', value: 620 },
  { name: 'Sab', value: 780 },
  { name: 'Dom', value: 590 },
];

const PIE_DATA = [
  { name: 'Indumentaria', value: 4200 },
  { name: 'Alimentos', value: 3100 },
  { name: 'Electronica', value: 2400 },
  { name: 'Hogar', value: 1800 },
];

const CANDLE_DATA = [
  { name: 'M', value: 0, open: 420, close: 460, high: 480, low: 410 },
  { name: 'T', value: 0, open: 460, close: 440, high: 475, low: 430 },
  { name: 'W', value: 0, open: 440, close: 510, high: 525, low: 435 },
  { name: 'T', value: 0, open: 510, close: 495, high: 530, low: 480 },
  { name: 'F', value: 0, open: 495, close: 580, high: 600, low: 490 },
  { name: 'S', value: 0, open: 580, close: 620, high: 640, low: 570 },
  { name: 'S', value: 0, open: 620, close: 600, high: 635, low: 590 },
];

const INITIAL_STORES: Store[] = [];

const INITIAL_METRICS: Metric[] = [];

const SELECTED_STORE_KEY = 'selectedStoreId';

export function useStoreState() {
  const initialSelectedStoreId = typeof window === 'undefined'
    ? 1
    : Number(window.localStorage.getItem(SELECTED_STORE_KEY) || '1');

  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<number>(initialSelectedStoreId);
  const [viewMode, setViewMode] = useState<ViewMode>('metrics');
  const [gridColumns, setGridColumns] = useState<GridColumns>(2);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>();
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>();
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(SELECTED_STORE_KEY, String(selectedStoreId));
  }, [selectedStoreId]);

  // Cargar tiendas desde backend al iniciar
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const data = await listStores()
      if (!mounted) return
      if (data) {
        // mapear campos del backend a Store
        const mapped = data.map(d => ({ id: d.id_sucursal, name: d.nombre, files: [] }))
        setStores(mapped)
        if (mapped.length > 0) {
          const persistedStore = mapped.find(store => store.id === initialSelectedStoreId);
          setSelectedStoreId(persistedStore?.id || mapped[0].id);
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  const addStore = useCallback(async (name: string) => {
    const res = await createStore(name);

    if (!res?.id_sucursal) {
      return;
    }

    const newStore: Store = { id: res.id_sucursal, name, files: [] };
    setStores(prev => [...prev, newStore]);
    setSelectedStoreId(newStore.id);
  }, []);

  const deleteStore = useCallback(async (id: number) => {
    const ok = await setStoreActivo(id, false);
    if (ok) {
      setStores(prev => prev.filter(s => s.id !== id));
      setSelectedStoreId(prev => prev === id ? (stores[0]?.id || 1) : prev);
    }
  }, [stores]);

  const editStoreName = useCallback(async (id: number, nombre: string) => {
    const ok = await updateStoreName(id, nombre);
    if (ok) {
      setStores(prev => prev.map(s => s.id === id ? { ...s, name: nombre } : s));
    }
  }, []);

  const addMetric = useCallback((title: string, category: string) => {
    const newMetric: Metric = {
      id: Date.now().toString(),
      title,
      category,
      value: '—',
      change: 0,
      titleInfo: ''
    };
    setMetrics(prev => [...prev, newMetric]);
  }, []);

  const removeMetric = useCallback((id: string) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
  }, []);

  const reorderMetrics = useCallback((fromId: string, toId: string) => {
    setMetrics(prev => {
      const from = prev.findIndex(m => m.id === fromId);
      const to = prev.findIndex(m => m.id === toId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const duplicateMetric = useCallback((id: string) => {
    setMetrics(prev => {
      const metric = prev.find(m => m.id === id);
      if (!metric) return prev;
      return [...prev, { ...metric, id: Date.now().toString(), title: `${metric.title} (copia)` }];
    });
  }, []);

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    stores: filteredStores,
    allStores: stores,
    editStoreName,
    selectedStoreId,
    setSelectedStoreId,
    viewMode,
    setViewMode,
    gridColumns,
    setGridColumns,
    dateRange,
    setDateRange,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
    metrics,
    searchQuery,
    setSearchQuery,
    addStore,
    deleteStore,
    addMetric,
    removeMetric,
    duplicateMetric,
    reorderMetrics,
  };
}

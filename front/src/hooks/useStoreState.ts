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
const STORE_DATE_FILTERS_KEY = 'storeDateFilters';
const PREDICTIONS_STORAGE_PREFIX = 'vision:predictions:';

type StoreDateFilter = {
  dateRange: DateRange;
  customDateStart?: string;
  customDateEnd?: string;
};

function getDefaultStoreDateFilter(): StoreDateFilter {
  return {
    dateRange: 'all',
  };
}

function readStoredDateFilters(): Record<number, StoreDateFilter> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORE_DATE_FILTERS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, StoreDateFilter>;
    const normalized: Record<number, StoreDateFilter> = {};

    for (const [storeId, filter] of Object.entries(parsed)) {
      const numericStoreId = Number(storeId);
      if (!Number.isFinite(numericStoreId)) {
        continue;
      }

      normalized[numericStoreId] = {
        dateRange: filter?.dateRange ?? 'all',
        customDateStart: filter?.customDateStart,
        customDateEnd: filter?.customDateEnd,
      };
    }

    return normalized;
  } catch {
    return {};
  }
}

function clearStoredPredictionsForStore(storeId: number) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(`${PREDICTIONS_STORAGE_PREFIX}${storeId}`);
}

function prunePredictionsForMissingStores(existingStoreIds: number[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const validIds = new Set(existingStoreIds);
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREDICTIONS_STORAGE_PREFIX)) {
      continue;
    }

    const storeId = Number(key.slice(PREDICTIONS_STORAGE_PREFIX.length));
    if (!Number.isFinite(storeId) || !validIds.has(storeId)) {
      window.localStorage.removeItem(key);
    }
  }
}

export function useStoreState() {
  const initialSelectedStoreId = typeof window === 'undefined'
    ? 1
    : Number(window.localStorage.getItem(SELECTED_STORE_KEY) || '1');

  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<number>(initialSelectedStoreId);
  const [viewMode, setViewMode] = useState<ViewMode>('metrics');
  const [gridColumns, setGridColumns] = useState<GridColumns>(2);
  const [storeDateFilters, setStoreDateFilters] = useState<Record<number, StoreDateFilter>>(readStoredDateFilters);
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [searchQuery, setSearchQuery] = useState('');

  const currentDateFilter = storeDateFilters[selectedStoreId] ?? getDefaultStoreDateFilter();
  const dateRange = currentDateFilter.dateRange;
  const customDateStart = currentDateFilter.customDateStart;
  const customDateEnd = currentDateFilter.customDateEnd;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(SELECTED_STORE_KEY, String(selectedStoreId));
  }, [selectedStoreId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(STORE_DATE_FILTERS_KEY, JSON.stringify(storeDateFilters));
  }, [storeDateFilters]);

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
        prunePredictionsForMissingStores(mapped.map(store => store.id));
        setStoreDateFilters(prev => {
          const next = { ...prev };
          for (const store of mapped) {
            if (!next[store.id]) {
              next[store.id] = getDefaultStoreDateFilter();
            }
          }
          return next;
        });
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
    clearStoredPredictionsForStore(newStore.id);
    setSelectedStoreId(newStore.id);
  }, []);

  const deleteStore = useCallback(async (id: number) => {
    const ok = await setStoreActivo(id, false);
    if (ok) {
      clearStoredPredictionsForStore(id);
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

  const setDateRange = useCallback((nextRange: DateRange) => {
    setStoreDateFilters(prev => ({
      ...prev,
      [selectedStoreId]: {
        ...(prev[selectedStoreId] ?? getDefaultStoreDateFilter()),
        dateRange: nextRange,
      },
    }));
  }, [selectedStoreId]);

  const setCustomDateStart = useCallback((startDate: string | undefined) => {
    setStoreDateFilters(prev => ({
      ...prev,
      [selectedStoreId]: {
        ...(prev[selectedStoreId] ?? getDefaultStoreDateFilter()),
        customDateStart: startDate,
      },
    }));
  }, [selectedStoreId]);

  const setCustomDateEnd = useCallback((endDate: string | undefined) => {
    setStoreDateFilters(prev => ({
      ...prev,
      [selectedStoreId]: {
        ...(prev[selectedStoreId] ?? getDefaultStoreDateFilter()),
        customDateEnd: endDate,
      },
    }));
  }, [selectedStoreId]);

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

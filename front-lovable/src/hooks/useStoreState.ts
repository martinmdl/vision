import { useState, useCallback } from 'react';
import type { Store, Metric, ViewMode, GridColumns, DateRange } from '@/types/store';

const SAMPLE_DATA = [
  { name: 'Mon', value: 420 },
  { name: 'Tue', value: 380 },
  { name: 'Wed', value: 510 },
  { name: 'Thu', value: 470 },
  { name: 'Fri', value: 620 },
  { name: 'Sat', value: 780 },
  { name: 'Sun', value: 590 },
];

const PIE_DATA = [
  { name: 'Apparel', value: 4200 },
  { name: 'Food', value: 3100 },
  { name: 'Electronics', value: 2400 },
  { name: 'Home', value: 1800 },
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

const INITIAL_STORES: Store[] = [
  { id: '1', name: 'Downtown Mall', files: ['sales_jan.xlsx'] },
  { id: '2', name: 'Airport Branch', files: [] },
  { id: '3', name: 'Harbor District', files: ['q4_report.xlsx', 'inventory.xlsx'] },
];

const INITIAL_METRICS: Metric[] = [
  { id: 'm1', title: 'Total Revenue', category: 'finance', value: '$48,290', change: 12.5, chartType: 'area', data: SAMPLE_DATA },
  { id: 'm2', title: 'Units Sold', category: 'product', value: '3,847', change: -2.3, chartType: 'bar', data: SAMPLE_DATA },
  { id: 'm3', title: 'Gross Margin', category: 'finance', value: '34.2%', change: 1.8, chartType: 'line', data: SAMPLE_DATA },
  { id: 'm4', title: 'Avg Basket Size', category: 'customer', value: '$27.40', change: 5.1, chartType: 'area', data: SAMPLE_DATA },
  { id: 'm5', title: 'Sales by Category', category: 'product', value: '$11.5K', change: 4.2, chartType: 'pie', data: PIE_DATA },
  { id: 'm6', title: 'Channel Mix', category: 'finance', value: '62%', change: 2.1, chartType: 'donut', data: PIE_DATA },
  { id: 'm7', title: 'Top Products', category: 'product', value: '128', change: 8.4, chartType: 'hbar', data: PIE_DATA },
  { id: 'm8', title: 'Daily Price Range', category: 'finance', value: '$612', change: 3.7, chartType: 'candle', data: CANDLE_DATA },
  { id: 'm9', title: 'Performance Score', category: 'operations', value: '87', change: 6.5, chartType: 'radial', data: [{ name: 'score', value: 87 }] },
  { id: 'm10', title: 'Customer Profile', category: 'customer', value: '4.6/5', change: 1.2, chartType: 'radar', data: [
    { name: 'Loyalty', value: 80 }, { name: 'Spend', value: 65 }, { name: 'Visits', value: 90 },
    { name: 'Reviews', value: 70 }, { name: 'Referrals', value: 55 },
  ]},
];

export function useStoreState() {
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('1');
  const [viewMode, setViewMode] = useState<ViewMode>('metrics');
  const [gridColumns, setGridColumns] = useState<GridColumns>(2);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [searchQuery, setSearchQuery] = useState('');

  const addStore = useCallback((name: string) => {
    const newStore: Store = { id: Date.now().toString(), name, files: [] };
    setStores(prev => [...prev, newStore]);
    setSelectedStoreId(newStore.id);
  }, []);

  const deleteStore = useCallback((id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
    setSelectedStoreId(prev => prev === id ? stores[0]?.id || '' : prev);
  }, [stores]);

  const addMetric = useCallback((title: string, category: string) => {
    const newMetric: Metric = {
      id: Date.now().toString(),
      title,
      category,
      value: '—',
      change: 0,
      chartType: 'line',
      data: SAMPLE_DATA,
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
      return [...prev, { ...metric, id: Date.now().toString(), title: `${metric.title} (copy)` }];
    });
  }, []);

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    stores: filteredStores,
    allStores: stores,
    selectedStoreId,
    setSelectedStoreId,
    viewMode,
    setViewMode,
    gridColumns,
    setGridColumns,
    dateRange,
    setDateRange,
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

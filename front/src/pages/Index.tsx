import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import MetricsDashboard from '@/components/dashboard/MetricsDashboard';
import PredictionsView from '@/components/dashboard/PredictionsView';
import DataView from '@/components/dashboard/DataView';
import { useStoreState } from '@/hooks/useStoreState';
import { getProcessedDataSummary } from '@/api/services/mvp.ts';
import { useEffect, useState } from 'react';

export default function Index() {
  const state = useStoreState();
  const selectedStore = state.allStores.find(s => s.id === state.selectedStoreId);
  const [storeDateBounds, setStoreDateBounds] = useState<Record<number, { startDate: string; endDate: string }>>({});

  function computeRange(range: string | undefined) {
    if (!range) return { startDate: undefined, endDate: undefined };
    if (range === 'all') {
      return storeDateBounds[state.selectedStoreId] || { startDate: undefined, endDate: undefined };
    }

    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    let start: Date | undefined;
    if (range === '7d') start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (range === '90d') start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (range === 'custom') {
      return {
        startDate: state.customDateStart,
        endDate: state.customDateEnd,
      };
    }
    else return { startDate: undefined, endDate: undefined };

    const startDate = start.toISOString().slice(0, 10);
    return { startDate, endDate };
  }

  const { startDate, endDate } = computeRange(state.dateRange);

  useEffect(() => {
    let mounted = true;

    const loadStoreDateBounds = async () => {
      const response = await getProcessedDataSummary(state.selectedStoreId);
      if (!mounted || response.status_code !== 200 || !response.data?.overview) {
        return;
      }

      const firstDate = response.data.overview.first_sale_date;
      const lastDate = response.data.overview.last_sale_date;

      if (!firstDate || !lastDate) {
        return;
      }

      setStoreDateBounds(prev => ({
        ...prev,
        [state.selectedStoreId]: {
          startDate: firstDate,
          endDate: lastDate,
        },
      }));
    };

    loadStoreDateBounds();

    const onDataUploaded = (event: Event) => {
      if (!mounted) {
        return;
      }

      const detail = (event as CustomEvent<{ storeId?: number | null }>).detail;
      if (!detail || detail.storeId == null || detail.storeId === state.selectedStoreId) {
        loadStoreDateBounds();
      }
    };

    window.addEventListener('vision:data-uploaded', onDataUploaded as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('vision:data-uploaded', onDataUploaded as EventListener);
    };
  }, [state.selectedStoreId]);

  useEffect(() => {
      const viewLabel = state.viewMode === 'metrics'
        ? 'Métricas'
        : state.viewMode === 'predictions'
          ? 'Predicciones'
          : 'Datos';
      const storeName = selectedStore?.name || 'Sin comercio';
      document.title = `Vision | ${storeName} | ${viewLabel}`;
    }, [selectedStore?.name, state.viewMode]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        stores={state.stores}
        selectedStoreId={state.selectedStoreId}
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        onSelectStore={state.setSelectedStoreId}
        onAddStore={state.addStore}
        onDeleteStore={state.deleteStore}
        onEditStore={state.editStoreName}
      />

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <TopBar
          dateRange={state.dateRange}
          onDateRangeChange={state.setDateRange}
          viewMode={state.viewMode}
          onViewChange={state.setViewMode}
          storeName={selectedStore?.name || 'Selecciona una tienda'}
          activeStartDate={startDate}
          activeEndDate={endDate}
          customDateStart={state.customDateStart}
          customDateEnd={state.customDateEnd}
          onCustomDateChange={(start, end) => {
            state.setCustomDateStart(start);
            state.setCustomDateEnd(end);
          }}
        />

        {state.viewMode === 'metrics' ? (
          <MetricsDashboard
            selectedStoreId={state.selectedStoreId}
            startDate={startDate}
            endDate={endDate}
          />
        ) : state.viewMode === 'predictions' ? (
          <PredictionsView selectedStoreId={state.selectedStoreId} hasSelectedStore={Boolean(selectedStore)} />
        ) : (
          <DataView selectedStoreId={state.selectedStoreId} />
        )}
      </main>
    </div>
  );
}

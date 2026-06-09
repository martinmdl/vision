import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import MetricsDashboard from '@/components/dashboard/MetricsDashboard';
import PredictionsView from '@/components/dashboard/PredictionsView';
import DataView from '@/components/dashboard/DataView';
import { useStoreState } from '@/hooks/useStoreState';
import { useEffect } from 'react';

export default function Index() {
  const state = useStoreState();
  const selectedStore = state.allStores.find(s => s.id === state.selectedStoreId);
  function computeRange(range: string | undefined) {
    if (!range) return { startDate: undefined, endDate: undefined };
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    let start: Date | undefined;
    if (range === '7d') start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (range === '90d') start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    else return { startDate: undefined, endDate: undefined };

    const startDate = start.toISOString().slice(0, 10);
    return { startDate, endDate };
  }

  const { startDate, endDate } = computeRange(state.dateRange);

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
        />

        {state.viewMode === 'metrics' ? (
          <MetricsDashboard
            selectedStoreId={state.selectedStoreId}
            startDate={startDate}
            endDate={endDate}
          />
        ) : state.viewMode === 'predictions' ? (
          <PredictionsView selectedStoreId={state.selectedStoreId} />
        ) : (
          <DataView selectedStoreId={state.selectedStoreId} />
        )}
      </main>
    </div>
  );
}

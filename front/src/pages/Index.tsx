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

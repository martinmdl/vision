import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import MetricsDashboard from '@/components/dashboard/MetricsDashboard';
import PredictionsView from '@/components/dashboard/PredictionsView';
import DataView from '@/components/dashboard/DataView';
import { useStoreState } from '@/hooks/useStoreState';

export default function Index() {
  const state = useStoreState();
  const selectedStore = state.allStores.find(s => s.id === state.selectedStoreId);

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

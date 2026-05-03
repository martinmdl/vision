import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import type { Metric, GridColumns } from '@/types/store';
import MetricCard from './MetricCard';
import AddMetricModal from './AddMetricModal';

interface MetricsDashboardProps {
  metrics: Metric[];
  gridColumns: GridColumns;
  onRemoveMetric: (id: string) => void;
  onDuplicateMetric: (id: string) => void;
  onAddMetric: (title: string, category: string) => void;
}

export default function MetricsDashboard({
  metrics, gridColumns, onRemoveMetric, onDuplicateMetric, onAddMetric,
}: MetricsDashboardProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className={`grid gap-4 ${gridColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <AnimatePresence>
          {metrics.map(m => (
            <MetricCard key={m.id} metric={m} onRemove={onRemoveMetric} onDuplicate={onDuplicateMetric} />
          ))}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center z-50"
      >
        <Plus className="w-5 h-5" />
      </button>

      <AddMetricModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={onAddMetric} />
    </>
  );
}

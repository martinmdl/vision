import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Metric, GridColumns } from '@/types/store';
import MetricCard from './MetricCard';
import AddMetricModal from './AddMetricModal';

interface MetricsDashboardProps {
  metrics: Metric[];
  gridColumns: GridColumns;
  onRemoveMetric: (id: string) => void;
  onDuplicateMetric: (id: string) => void;
  onAddMetric: (title: string, category: string) => void;
  onReorderMetrics: (fromId: string, toId: string) => void;
}

function SortableMetric({ metric, onRemove, onDuplicate }: {
  metric: Metric;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <MetricCard metric={metric} onRemove={onRemove} onDuplicate={onDuplicate} />
    </div>
  );
}

export default function MetricsDashboard({
  metrics, gridColumns, onRemoveMetric, onDuplicateMetric, onAddMetric, onReorderMetrics,
}: MetricsDashboardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      onReorderMetrics(String(active.id), String(over.id));
    }
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={metrics.map(m => m.id)} strategy={rectSortingStrategy}>
          <div className={`grid gap-4 ${gridColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <AnimatePresence>
              {metrics.map(m => (
                <SortableMetric key={m.id} metric={m} onRemove={onRemoveMetric} onDuplicate={onDuplicateMetric} />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

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

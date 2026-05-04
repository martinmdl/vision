import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Metric } from '@/types/store';
import MetricCard from './MetricCard';
import AddMetricModal from './AddMetricModal';
import { getTopSoldProducts, type TopSoldProductItem } from '@/api/services/mvp.ts';

interface MetricsDashboardProps {
  metrics: Metric[];
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
  metrics, onRemoveMetric, onDuplicateMetric, onAddMetric, onReorderMetrics,
}: MetricsDashboardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [topProducts, setTopProducts] = useState<TopSoldProductItem[]>([]);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(false);
  const [topProductsError, setTopProductsError] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const hasTopProducts = useMemo(() => topProducts.length > 0, [topProducts]);

  useEffect(() => {
    let mounted = true;

    const loadTopProducts = async () => {
      setIsLoadingTopProducts(true);
      setTopProductsError('');

      const response = await getTopSoldProducts(10);
      if (!mounted) return;

      if (response.status_code === 200 && Array.isArray(response.data)) {
        setTopProducts(response.data);
      } else {
        setTopProducts([]);
        setTopProductsError(response.message || 'No se pudo obtener la metrica.');
      }

      setIsLoadingTopProducts(false);
    };

    loadTopProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      onReorderMetrics(String(active.id), String(over.id));
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-card p-5 mb-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-card-foreground">Top 10 Productos mas vendidos</h3>
          {topProductsError && <span className="text-xs text-destructive">{topProductsError}</span>}
        </div>

        {isLoadingTopProducts ? (
          <p className="text-xs text-muted-foreground">Cargando metrica...</p>
        ) : hasTopProducts ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={75} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground">No hay ventas suficientes para mostrar.</p>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={metrics.map(m => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

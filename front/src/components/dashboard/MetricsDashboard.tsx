import { useEffect, useState } from 'react';
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
import type { Metric } from '@/types/store';
import MetricCard from './MetricCard';
import AddMetricModal from './AddMetricModal';
import {
  getTopSoldProducts,
  getTopProfitableProducts,
  getWeatherImpactIncome,
  getCalendarImpactIncome,
  getCalendarUplift,
  type TopSoldProductItem,
  type TopProfitableProductItem,
  type WeatherImpactIncomeItem,
  type CalendarImpactIncomeItem,
  type CalendarUpliftItem,
} from '@/api/services/mvp.ts';
import {
  TopProductsChart,
  TopProfitableProductsChart,
  WeatherImpactIncomeChart,
  CalendarImpactIncomeChart,
} from './MetricContent';

interface MetricsDashboardProps {
  metrics: Metric[];
  onRemoveMetric: (id: string) => void;
  onDuplicateMetric: (id: string) => void;
  onAddMetric: (title: string, category: string) => void;
  onReorderMetrics: (fromId: string, toId: string) => void;
}

function UpliftKpiCard({
  title,
  value,
  isLoading,
  error,
}: {
  title: string;
  value: number;
  isLoading: boolean;
  error: string;
}) {
  const formatted = `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  const normalized = Math.max(0, Math.min(1, (value + 20) / 40));
  const hue = 48 + (120 - 48) * normalized;
  const backgroundColor = `hsl(${hue} 85% 84% / 0.95)`;
  const borderColor = `hsl(${hue} 52% 58% / 0.75)`;

  if (error) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border shadow-card p-5 bg-card">
        <h3 className="text-sm font-semibold text-card-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground">Cargando métrica...</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border shadow-card hover:shadow-card-hover transition-shadow p-5"
      style={{
        backgroundColor,
        borderColor,
      }}
    >
      <h3 className="text-sm font-semibold text-card-foreground mb-3">{title}</h3>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-card-foreground">{formatted}</span>
        <span className="text-xs text-card-foreground/75">vs dia normal</span>
      </div>
    </div>
  );
}

function SortableMetric({
  metric,
  onRemove,
  onDuplicate,
}: {
  metric: Metric;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <MetricCard
        metric={metric}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
      />
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

  const [topProfitableProducts, setTopProfitableProducts] = useState<TopProfitableProductItem[]>([]);
  const [isLoadingTopProfitableProducts, setIsLoadingTopProfitableProducts] = useState(false);
  const [topProfitableProductsError, setTopProfitableProductsError] = useState('');

  const [weatherImpactIncome, setWeatherImpactIncome] = useState<WeatherImpactIncomeItem[]>([]);
  const [isLoadingWeatherImpactIncome, setIsLoadingWeatherImpactIncome] = useState(false);
  const [weatherImpactIncomeError, setWeatherImpactIncomeError] = useState('');

  const [calendarImpactIncome, setCalendarImpactIncome] = useState<CalendarImpactIncomeItem[]>([]);
  const [isLoadingCalendarImpactIncome, setIsLoadingCalendarImpactIncome] = useState(false);
  const [calendarImpactIncomeError, setCalendarImpactIncomeError] = useState('');

  const [calendarUplift, setCalendarUplift] = useState<CalendarUpliftItem>({
    holiday_uplift: 0,
    weekend_uplift: 0,
  });
  const [isLoadingCalendarUplift, setIsLoadingCalendarUplift] = useState(false);
  const [calendarUpliftError, setCalendarUpliftError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    let mounted = true;

    const loadRankingMetric = async <T,>(
      request: () => Promise<{ status_code: number; message: string; data?: T[] }>,
      setData: (value: T[]) => void,
      setError: (value: string) => void,
      setIsLoading: (value: boolean) => void,
    ) => {
      setIsLoading(true);
      setError('');

      const response = await request();
      if (!mounted) return;

      if (response.status_code === 200 && Array.isArray(response.data)) {
        setData(response.data);
      } else {
        setData([]);
        setError(response.message || 'No se pudo obtener la metrica.');
      }

      setIsLoading(false);
    };

    const loadTopProducts = async () => {
      await loadRankingMetric(
        () => getTopSoldProducts(10),
        setTopProducts,
        setTopProductsError,
        setIsLoadingTopProducts,
      );
    };

    const loadTopProfitableProducts = async () => {
      await loadRankingMetric(
        () => getTopProfitableProducts(10),
        setTopProfitableProducts,
        setTopProfitableProductsError,
        setIsLoadingTopProfitableProducts,
      );
    };

    const loadWeatherImpactIncome = async () => {
      await loadRankingMetric(
        getWeatherImpactIncome,
        setWeatherImpactIncome,
        setWeatherImpactIncomeError,
        setIsLoadingWeatherImpactIncome,
      );
    };

    const loadCalendarImpactIncome = async () => {
      await loadRankingMetric(
        getCalendarImpactIncome,
        setCalendarImpactIncome,
        setCalendarImpactIncomeError,
        setIsLoadingCalendarImpactIncome,
      );
    };

    const loadCalendarUplift = async () => {
      setIsLoadingCalendarUplift(true);
      setCalendarUpliftError('');

      const response = await getCalendarUplift();
      if (!mounted) return;

      if (response.status_code === 200 && response.data) {
        setCalendarUplift(response.data);
      } else {
        setCalendarUplift({ holiday_uplift: 0, weekend_uplift: 0 });
        setCalendarUpliftError(response.message || 'No se pudo obtener la metrica.');
      }

      setIsLoadingCalendarUplift(false);
    };

    loadTopProducts();
    loadTopProfitableProducts();
    loadWeatherImpactIncome();
    loadCalendarImpactIncome();
    loadCalendarUplift();

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <UpliftKpiCard
          title="Incremento por feriado"
          value={calendarUplift.holiday_uplift}
          isLoading={isLoadingCalendarUplift}
          error={calendarUpliftError}
        />

        <UpliftKpiCard
          title="Incremento por fin de semana"
          value={calendarUplift.weekend_uplift}
          isLoading={isLoadingCalendarUplift}
          error={calendarUpliftError}
        />

        <MetricCard
          title="Top 10 Productos más vendidos"
          isLoading={isLoadingTopProducts}
          error={topProductsError}
          hasData={topProducts.length > 0}
        >
          <TopProductsChart data={topProducts} />
        </MetricCard>

        <MetricCard
          title="Top 10 Productos más rentables"
          isLoading={isLoadingTopProfitableProducts}
          error={topProfitableProductsError}
          hasData={topProfitableProducts.length > 0}
        >
          <TopProfitableProductsChart data={topProfitableProducts} />
        </MetricCard>

        <MetricCard
          title="Impacto de Clima Adverso"
          isLoading={isLoadingWeatherImpactIncome}
          error={weatherImpactIncomeError}
          hasData={weatherImpactIncome.length > 0}
        >
          <WeatherImpactIncomeChart data={weatherImpactIncome} />
        </MetricCard>

        <MetricCard
          title="Comparativa por Tipo de Dia"
          isLoading={isLoadingCalendarImpactIncome}
          error={calendarImpactIncomeError}
          hasData={calendarImpactIncome.length > 0}
        >
          <CalendarImpactIncomeChart data={calendarImpactIncome} />
        </MetricCard>
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

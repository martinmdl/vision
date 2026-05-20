import { useEffect, useState } from 'react';
import { Info, Plus } from 'lucide-react';
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
  getCategoryProfitability,
  type TopSoldProductItem,
  type TopProfitableProductItem,
  type WeatherImpactIncomeItem,
  type CalendarImpactIncomeItem,
  type CalendarUpliftItem,
  type CategoryProfitabilityItem,
} from '@/api/services/mvp.ts';
import {
  TopProductsChart,
  TopProfitableProductsChart,
  WeatherImpactIncomeChart,
  CalendarImpactIncomeChart,
  CategoryProfitabilityChart,
} from './MetricContent';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricsDashboardProps {
  metrics: Metric[];
  selectedStoreId: number;
  onRemoveMetric: (id: string) => void;
  onDuplicateMetric: (id: string) => void;
  onAddMetric: (title: string, category: string) => void;
  onReorderMetrics: (fromId: string, toId: string) => void;
}

function UpliftKpiCard({
  title,
  titleInfo,
  value,
  isLoading,
  error,
}: {
  title: string;
  titleInfo: string;
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
        <h3 className="text-sm font-semibold text-card-foreground mb-2 inline-flex items-center gap-1.5">
          <span>{title}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Más información"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              {titleInfo}
            </TooltipContent>
          </Tooltip>
        </h3>
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
      <h3 className="text-sm font-semibold text-card-foreground mb-3 inline-flex items-center gap-1.5">
        <span>{title}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Más información"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            {titleInfo}
          </TooltipContent>
        </Tooltip>
      </h3>
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
  metrics, selectedStoreId, onRemoveMetric, onDuplicateMetric, onAddMetric, onReorderMetrics,
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

  const [categoryProfitability, setCategoryProfitability] = useState<CategoryProfitabilityItem[]>([]);
  const [isLoadingCategoryProfitability, setIsLoadingCategoryProfitability] = useState(false);
  const [categoryProfitabilityError, setCategoryProfitabilityError] = useState('');

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
        () => getTopSoldProducts(selectedStoreId, 10),
        setTopProducts,
        setTopProductsError,
        setIsLoadingTopProducts,
      );
    };

    const loadTopProfitableProducts = async () => {
      await loadRankingMetric(
        () => getTopProfitableProducts(selectedStoreId, 10),
        setTopProfitableProducts,
        setTopProfitableProductsError,
        setIsLoadingTopProfitableProducts,
      );
    };

    const loadWeatherImpactIncome = async () => {
      await loadRankingMetric(
        () => getWeatherImpactIncome(selectedStoreId),
        setWeatherImpactIncome,
        setWeatherImpactIncomeError,
        setIsLoadingWeatherImpactIncome,
      );
    };

    const loadCalendarImpactIncome = async () => {
      await loadRankingMetric(
        () => getCalendarImpactIncome(selectedStoreId),
        setCalendarImpactIncome,
        setCalendarImpactIncomeError,
        setIsLoadingCalendarImpactIncome,
      );
    };

    const loadCategoryProfitability = async () => {
      await loadRankingMetric(
        () => getCategoryProfitability(selectedStoreId),
        setCategoryProfitability,
        setCategoryProfitabilityError,
        setIsLoadingCategoryProfitability,
      );
    };

    const loadCalendarUplift = async () => {
      setIsLoadingCalendarUplift(true);
      setCalendarUpliftError('');

      const response = await getCalendarUplift(selectedStoreId);
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
    loadCategoryProfitability();

    return () => {
      mounted = false;
    };
  }, [selectedStoreId]);
  
  const hasUploadedData =
    topProducts.length > 0 ||
    topProfitableProducts.length > 0 ||
    weatherImpactIncome.length > 0 ||
    calendarImpactIncome.length > 0 ||
    categoryProfitability.length > 0;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      onReorderMetrics(String(active.id), String(over.id));
    }
  };

  return (
    <>
    {hasUploadedData ? (
      <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <UpliftKpiCard
          title="Incremento por feriado"
          titleInfo="Tasa de aumento porcentual de ganancia en días festivos respecto a días normales."
          value={calendarUplift.holiday_uplift}
          isLoading={isLoadingCalendarUplift}
          error={calendarUpliftError}
        />

        <UpliftKpiCard
          title="Incremento por fin de semana"
          titleInfo="Tasa de aumento porcentual de ganancia en fines de semana respecto a días normales."
          value={calendarUplift.weekend_uplift}
          isLoading={isLoadingCalendarUplift}
          error={calendarUpliftError}
        />

        <MetricCard
          title="Top 10 Productos más vendidos"
          titleInfo="Ranking de los 10 productos con mayor demanda acumulada en el período analizado."
          isLoading={isLoadingTopProducts}
          error={topProductsError}
          hasData={topProducts.length > 0}
        >
          <TopProductsChart data={topProducts} />
        </MetricCard>

        <MetricCard
          title="Top 10 Productos más rentables"
          titleInfo="Ranking de los 10 productos con mayor ganancia total. Eje monetario expresado en miles de pesos."
          isLoading={isLoadingTopProfitableProducts}
          error={topProfitableProductsError}
          hasData={topProfitableProducts.length > 0}
        >
          <TopProfitableProductsChart data={topProfitableProducts} />
        </MetricCard>

        <MetricCard
          title="Impacto de Clima Adverso"
          titleInfo="Comparación mensual de ingresos entre días lluviosos y días despejados. Valores en miles de pesos."
          isLoading={isLoadingWeatherImpactIncome}
          error={weatherImpactIncomeError}
          hasData={weatherImpactIncome.length > 0}
        >
          <WeatherImpactIncomeChart data={weatherImpactIncome} />
        </MetricCard>

        <MetricCard
          title="Comparativa por Tipo de Dia"
          titleInfo="Comparación mensual de ingresos entre días festivos, normales y de fin de semana. Valores en miles de pesos."
          isLoading={isLoadingCalendarImpactIncome}
          error={calendarImpactIncomeError}
          hasData={calendarImpactIncome.length > 0}
        >
          <CalendarImpactIncomeChart data={calendarImpactIncome} />
        </MetricCard>

        <MetricCard
          title="Rentabilidad por Categoria"
          titleInfo="Distribución de la ganancia total por categoría de producto."
          isLoading={isLoadingCategoryProfitability}
          error={categoryProfitabilityError}
          hasData={categoryProfitability.length > 0}
        >
          <CategoryProfitabilityChart data={categoryProfitability} />
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
            </div>
      ) : (<div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No hay datos cargados
            </h3>

            <p className="text-sm text-muted-foreground">
            Sube un archivo para visualizar métricas personalizadas.
            </p>
      </div>)
      }

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

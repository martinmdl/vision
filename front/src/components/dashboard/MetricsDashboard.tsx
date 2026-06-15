import { useEffect, useMemo, useState } from 'react';
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
  getAllMetrics,
  type TopSoldProductItem,
  type TopProfitableProductItem,
  type WeatherImpactIncomeItem,
  type CalendarImpactIncomeItem,
  type CalendarUpliftItem,
  type CategoryProfitabilityItem,
  type TotalIncomeKpiItem,
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
  selectedStoreId: number;
  startDate?: string;
  endDate?: string;
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

function TotalIncomeKpiCard({
  value,
  salesDays,
  avgDaily,
  isLoading,
  error,
}: {
  value: number;
  salesDays: number;
  avgDaily: number;
  isLoading: boolean;
  error: string;
}) {
  if (error) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border shadow-card p-5 bg-card">
        <h3 className="text-sm font-semibold text-card-foreground mb-2">Ingreso total registrado</h3>
        <p className="text-xs text-muted-foreground">Calculando metrica...</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  return (
    <div className="rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5 bg-card">
      <h3 className="text-sm font-semibold text-card-foreground mb-2">Ingreso total registrado</h3>
      <p className="text-3xl font-bold text-card-foreground">{formatCurrency(value)}</p>
      <p className="text-xs text-muted-foreground mt-2">
        {salesDays} dias con ventas · promedio diario {formatCurrency(avgDaily)}
      </p>
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
  selectedStoreId,
  startDate,
  endDate,
}: MetricsDashboardProps) {
  const [metricIds, setMetricIds] = useState<string[]>([]);
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

  const [totalIncomeKpi, setTotalIncomeKpi] = useState<TotalIncomeKpiItem>({
    total_income: 0,
    total_sales: 0,
    sales_days: 0,
    avg_daily_income: 0,
  });
  const [isLoadingTotalIncomeKpi, setIsLoadingTotalIncomeKpi] = useState(false);
  const [totalIncomeKpiError, setTotalIncomeKpiError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    let mounted = true;

    const loadAllMetrics = async () => {
      // set all loading flags and clear errors
      setIsLoadingTopProducts(true);
      setIsLoadingTopProfitableProducts(true);
      setIsLoadingWeatherImpactIncome(true);
      setIsLoadingCalendarImpactIncome(true);
      setIsLoadingCategoryProfitability(true);
      setIsLoadingCalendarUplift(true);
        setIsLoadingTotalIncomeKpi(true);

      setTopProductsError('');
      setTopProfitableProductsError('');
      setWeatherImpactIncomeError('');
      setCalendarImpactIncomeError('');
      setCategoryProfitabilityError('');
      setCalendarUpliftError('');
      setTotalIncomeKpiError('');

      // fetch all metrics with a single call (idSucursal + explicit date window)
      const resp = await getAllMetrics(selectedStoreId, 10, startDate, endDate);
      if (!mounted) return;

      if (resp.status_code === 200 && resp.data) {
        const t = resp.data.top_sold;
        if (t && t.status_code === 200 && Array.isArray(t.data)) setTopProducts(t.data as TopSoldProductItem[]);
        else { setTopProducts([]); setTopProductsError(t?.message || 'No se pudo obtener la metrica.'); }

        const p = resp.data.top_profitable;
        if (p && p.status_code === 200 && Array.isArray(p.data)) setTopProfitableProducts(p.data as TopProfitableProductItem[]);
        else { setTopProfitableProducts([]); setTopProfitableProductsError(p?.message || 'No se pudo obtener la metrica.'); }

        const w = resp.data.weather_impact_income;
        if (w && w.status_code === 200 && Array.isArray(w.data)) setWeatherImpactIncome(w.data as WeatherImpactIncomeItem[]);
        else { setWeatherImpactIncome([]); setWeatherImpactIncomeError(w?.message || 'No se pudo obtener la metrica.'); }

        const c = resp.data.calendar_impact_income;
        if (c && c.status_code === 200 && Array.isArray(c.data)) setCalendarImpactIncome(c.data as CalendarImpactIncomeItem[]);
        else { setCalendarImpactIncome([]); setCalendarImpactIncomeError(c?.message || 'No se pudo obtener la metrica.'); }

        const cat = resp.data.category_profitability;
        if (cat && cat.status_code === 200 && Array.isArray(cat.data)) setCategoryProfitability(cat.data as CategoryProfitabilityItem[]);
        else { setCategoryProfitability([]); setCategoryProfitabilityError(cat?.message || 'No se pudo obtener la metrica.'); }

        const u = resp.data.calendar_uplift;
        if (u && u.status_code === 200 && u.data) setCalendarUplift(u.data as CalendarUpliftItem);
        else { setCalendarUplift({ holiday_uplift: 0, weekend_uplift: 0 }); setCalendarUpliftError(u?.message || 'No se pudo obtener la metrica.'); }

        const tik = resp.data.total_income_kpi || resp.data.total_income || resp.data.totalIncomeKpi;
        if (tik && tik.status_code === 200 && t.data) setTotalIncomeKpi(tik.data as TotalIncomeKpiItem);
        else { setTotalIncomeKpi({ total_income: 0, total_sales: 0, sales_days: 0, avg_daily_income: 0 }); setTotalIncomeKpiError(tik?.message || 'No se pudo obtener la metrica.'); }
      } else {
        const msg = resp.message || 'Error al obtener métricas';
        setTopProducts([]); setTopProductsError(msg);
        setTopProfitableProducts([]); setTopProfitableProductsError(msg);
        setWeatherImpactIncome([]); setWeatherImpactIncomeError(msg);
        setCalendarImpactIncome([]); setCalendarImpactIncomeError(msg);
        setCategoryProfitability([]); setCategoryProfitabilityError(msg);
        setCalendarUplift({ holiday_uplift: 0, weekend_uplift: 0 }); setCalendarUpliftError(msg);
        setTotalIncomeKpi({ total_income: 0, total_sales: 0, sales_days: 0, avg_daily_income: 0 }); setTotalIncomeKpiError(msg);
      }

      setIsLoadingTopProducts(false);
      setIsLoadingTopProfitableProducts(false);
      setIsLoadingWeatherImpactIncome(false);
      setIsLoadingCalendarImpactIncome(false);
      setIsLoadingCategoryProfitability(false);
      setIsLoadingCalendarUplift(false);
      setIsLoadingTotalIncomeKpi(false);
    };
    loadAllMetrics();

    return () => {
      mounted = false;
    };
  }, [selectedStoreId, startDate, endDate]);
  
  const hasUploadedData =
      topProducts.length > 0 ||
      topProfitableProducts.length > 0 ||
      weatherImpactIncome.length > 0 ||
      calendarImpactIncome.length > 0 ||
      categoryProfitability.length > 0 ||
      totalIncomeKpi.total_sales > 0;
        const onRemoveMetric = (id: string) => {
      setMetricIds(prev => prev.filter(metricId => metricId !== id));
    };

    const onDuplicateMetric = (id: string) => {
      setMetricIds(prev => [
        ...prev,
        `${id}::${crypto.randomUUID()}`
]);
    };

    const dashboardMetrics: Metric[] = useMemo(() => {
      return [
        {
          id: 'top-sold-products',
          title: 'Top 10 Productos más vendidos',
          titleInfo: 'Ranking de los 10 productos con mayor demanda acumulada en el período analizado.',
          category: 'product',

          value: `${topProducts.length} productos`,
          change: 0,

          isLoading: isLoadingTopProducts,
          error: topProductsError,

          hasData: topProducts.length > 0,

          renderContent: () => (
            <TopProductsChart data={topProducts} />
          ),
        },

        {
          id: 'top-profitable-products',
          title: 'Top 10 Productos más rentables',
          titleInfo: 'Ranking de los 10 productos con mayor ganancia total. Eje monetario expresado en miles de pesos.',
          category: 'finance',

          value: `${topProfitableProducts.length} productos`,
          change: 0,

          isLoading: isLoadingTopProfitableProducts,
          error: topProfitableProductsError,

          hasData: topProfitableProducts.length > 0,

          renderContent: () => (
            <TopProfitableProductsChart
              data={topProfitableProducts}
            />
          ),
        },

        {
          id: 'weather-impact-income',
          title: 'Impacto de Clima Adverso',
          titleInfo: 'Comparación mensual de ingresos entre días lluviosos y días despejados. Valores en miles de pesos.',
          category: 'weather',

          value: `${weatherImpactIncome.length} meses`,
          change: 0,

          isLoading: isLoadingWeatherImpactIncome,
          error: weatherImpactIncomeError,

          hasData: weatherImpactIncome.length > 0,

          renderContent: () => (
            <WeatherImpactIncomeChart
              data={weatherImpactIncome}
            />
          ),
        },

        {
          id: 'calendar-impact-income',
          title: 'Comparativa por Tipo de Día',
          titleInfo: 'Comparación mensual de ingresos entre días festivos, normales y de fin de semana. Valores en miles de pesos.',
          category: 'holidays',

          value: `${calendarImpactIncome.length} meses`,
          change: 0,

          isLoading: isLoadingCalendarImpactIncome,
          error: calendarImpactIncomeError,

          hasData: calendarImpactIncome.length > 0,

          renderContent: () => (
            <CalendarImpactIncomeChart
              data={calendarImpactIncome}
            />
          ),
        },

        {
          id: 'category-profitability',
          title: 'Rentabilidad por Categoría',
          titleInfo: 'Distribución de la ganancia total por categoría de producto.',
          category: 'finance',

          value: `${categoryProfitability.length} categorías`,
          change: 0,

          isLoading: isLoadingCategoryProfitability,
          error: categoryProfitabilityError,

          hasData: categoryProfitability.length > 0,

          renderContent: () => (
            <CategoryProfitabilityChart
              data={categoryProfitability}
            />
          ),
        },
      ];
    }, [
      topProducts,
      topProfitableProducts,
      weatherImpactIncome,
      calendarImpactIncome,
      categoryProfitability,

      isLoadingTopProducts,
      isLoadingTopProfitableProducts,
      isLoadingWeatherImpactIncome,
      isLoadingCalendarImpactIncome,
      isLoadingCategoryProfitability,

      topProductsError,
      topProfitableProductsError,
      weatherImpactIncomeError,
      calendarImpactIncomeError,
      categoryProfitabilityError,
    ]);

    useEffect(() => {
      setMetricIds(prev => {
        if (prev.length === 0) {
          return dashboardMetrics.map(m => m.id);
        }

        const validIds = prev.filter(id =>
          dashboardMetrics.some(m => m.id === id)
        );

        return validIds;
      });
    }, [dashboardMetrics]);

    const handleDragEnd = (e: DragEndEvent) => {
      const { active, over } = e;

      if (!over || active.id === over.id) return;

      setMetricIds(items => {
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));

        const updated = [...items];
        const [moved] = updated.splice(oldIndex, 1);

        updated.splice(newIndex, 0, moved);

        return updated;
      });
    };

    
  const orderedMetrics = metricIds
    .map(instanceId => {
      const baseId = instanceId.split('::')[0];

      const metric = dashboardMetrics.find(m => m.id === baseId);

      if (!metric) return null;

      return {
        ...metric,
        id: instanceId,
      };
    })
    .filter(Boolean) as Metric[];

  return (
    <>
    {hasUploadedData ? (
      <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <UpliftKpiCard
          title="Incremento por feriado"
          titleInfo="Tasa de aumento porcentual de ganancia en días festivos respecto a días normales."
          value={calendarUplift.holiday_uplift}
          isLoading={isLoadingCalendarUplift}
          error={calendarUpliftError}
        />

        <UpliftKpiCard
          title="Incremento por fin de semana"
          titleInfo="Tasa de aumento porcentual de ganancia en días festivos respecto a días normales."
          value={calendarUplift.weekend_uplift}
          isLoading={isLoadingCalendarUplift}
          error={calendarUpliftError}
        />

        <TotalIncomeKpiCard
          value={totalIncomeKpi.total_income}
          salesDays={totalIncomeKpi.sales_days}
          avgDaily={totalIncomeKpi.avg_daily_income}
          isLoading={isLoadingTotalIncomeKpi}
          error={totalIncomeKpiError}
        />
      </div>
      
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
            items={orderedMetrics.map(m => m.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {orderedMetrics.map(metric => (
                  <SortableMetric
                    key={metric.id}
                    metric={metric}
                    onRemove={onRemoveMetric}
                    onDuplicate={onDuplicateMetric}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </div>
      ) : (  <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
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

      <AddMetricModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={() => {}} />
    </>
  );
}
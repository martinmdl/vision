import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, Table, Info } from 'lucide-react';
import { getProcessedDataSummary, predict, type PredictionItem } from '@/api/services/mvp.ts';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DAILY_DATA = [
  { day: 'Lun', predicted: 1240 },
  { day: 'Mar', predicted: 1180 },
  { day: 'Mie', predicted: 1350 },
  { day: 'Jue', predicted: 1290 },
  { day: 'Vie', predicted: 1580 },
  { day: 'Sab', predicted: 1820 },
  { day: 'Dom', predicted: 1440 },
];

type HeatmapRow = {
  product: string;
  values: Record<string, number>;
};

function normalizeIsoDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function buildHeatmapFromPredictions(items: PredictionItem[]): { dateKeys: string[]; rows: HeatmapRow[] } {
  const allDates = Array.from(new Set(items.map(item => normalizeIsoDate(item.fecha_prediccion)))).sort((a, b) => a.localeCompare(b));
  const dateKeys = allDates.slice(0, 7);
  const allowedDates = new Set(dateKeys);

  const grouped = new Map<string, Record<string, number>>();

  for (const item of items) {
    const isoDate = normalizeIsoDate(item.fecha_prediccion);
    if (!allowedDates.has(isoDate)) {
      continue;
    }

    if (!grouped.has(item.nombre)) {
      grouped.set(
        item.nombre,
        dateKeys.reduce<Record<string, number>>((acc, dateKey) => {
          acc[dateKey] = 0;
          return acc;
        }, {})
      );
    }

    const rowValues = grouped.get(item.nombre)!;
    rowValues[isoDate] += Math.round(item.pred_cantidad || 0);
  }

  const rows = Array.from(grouped.entries())
    .map(([product, values]) => ({ product, values }))
    .sort((a, b) => {
      const totalA = dateKeys.reduce((sum, dateKey) => sum + (a.values[dateKey] || 0), 0);
      const totalB = dateKeys.reduce((sum, dateKey) => sum + (b.values[dateKey] || 0), 0);
      return totalB - totalA;
    })
    .slice(0, 12);

  return { dateKeys, rows };
}

function formatPredictionHeaderDate(dateIso: string, index: number) {
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }

  return date.toLocaleDateString('es-AR', index === 0
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' });
}

function formatLastPredictionDate(date: Date | null): string {
  if (!date) {
    return 'Sin predicciones recientes';
  }

  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getHeatColor(val: number) {
  if (val >= 55) return 'bg-primary/80 text-primary-foreground';
  if (val >= 45) return 'bg-primary/50 text-primary-foreground';
  if (val >= 35) return 'bg-primary/20 text-foreground';
  return 'bg-primary/5 text-foreground';
}

interface PredictionsViewProps {
  selectedStoreId: number;
  hasSelectedStore: boolean;
}

type StoredPredictionsState = {
  lastPredictionDate: string | null;
  heatmapDateKeys: string[];
  backendHeatmap: HeatmapRow[];
  predictMessage: string;
};

function getPredictionsStorageKey(storeId: number) {
  return `vision:predictions:${storeId}`;
}

export default function PredictionsView({ selectedStoreId, hasSelectedStore }: PredictionsViewProps) {
  const [view, setView] = useState<'aggregated' | 'detailed'>('aggregated');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStoreData, setIsCheckingStoreData] = useState(false);
  const [hasStoreData, setHasStoreData] = useState(false);
  const [lastPredictionDate, setLastPredictionDate] = useState<Date | null>(null);
  const [heatmapDateKeys, setHeatmapDateKeys] = useState<string[]>([]);
  const [backendHeatmap, setBackendHeatmap] = useState<HeatmapRow[]>([]);
  const [predictMessage, setPredictMessage] = useState<string>('');
  const [predictProgress, setPredictProgress] = useState(0);
  const [predictStage, setPredictStage] = useState('');

  useEffect(() => {
    if (!hasSelectedStore) {
      setHasStoreData(false);
      setIsCheckingStoreData(false);
      return;
    }

    let mounted = true;
    setIsCheckingStoreData(true);

    const checkStoreData = async () => {
      const response = await getProcessedDataSummary(selectedStoreId);
      if (!mounted) {
        return;
      }

      const overview = response.data?.overview;
      const hasRows = Boolean(
        overview &&
        (overview.sales_rows > 0 || overview.products_rows > 0 || overview.sale_detail_rows > 0)
      );

      setHasStoreData(hasRows);
      setIsCheckingStoreData(false);
    };

    checkStoreData();

    const onDataUploaded = (event: Event) => {
      const detail = (event as CustomEvent<{ storeId?: number | null }>).detail;
      if (!detail || detail.storeId == null || detail.storeId === selectedStoreId) {
        checkStoreData();
      }
    };

    window.addEventListener('vision:data-uploaded', onDataUploaded as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('vision:data-uploaded', onDataUploaded as EventListener);
    };
  }, [selectedStoreId, hasSelectedStore]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(getPredictionsStorageKey(selectedStoreId));
      if (!raw) {
        setLastPredictionDate(null);
        setHeatmapDateKeys([]);
        setBackendHeatmap([]);
        setPredictMessage('');
        return;
      }

      const parsed = JSON.parse(raw) as StoredPredictionsState;
      setLastPredictionDate(parsed.lastPredictionDate ? new Date(parsed.lastPredictionDate) : null);
      setHeatmapDateKeys(Array.isArray(parsed.heatmapDateKeys) ? parsed.heatmapDateKeys : []);
      setBackendHeatmap(Array.isArray(parsed.backendHeatmap) ? parsed.backendHeatmap : []);
      setPredictMessage(parsed.predictMessage || '');
    } catch {
      setLastPredictionDate(null);
      setHeatmapDateKeys([]);
      setBackendHeatmap([]);
      setPredictMessage('');
    }
  }, [selectedStoreId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: StoredPredictionsState = {
      lastPredictionDate: lastPredictionDate ? lastPredictionDate.toISOString() : null,
      heatmapDateKeys,
      backendHeatmap,
      predictMessage,
    };

    window.localStorage.setItem(getPredictionsStorageKey(selectedStoreId), JSON.stringify(payload));
  }, [selectedStoreId, lastPredictionDate, heatmapDateKeys, backendHeatmap, predictMessage]);

  const heatmapData = backendHeatmap;

  const totalPredicted = DAILY_DATA.reduce((sum, d) => sum + d.predicted, 0);
  const highestDay = DAILY_DATA.reduce((max, d) => d.predicted > max.predicted ? d : max, DAILY_DATA[0]);
  const hasPredictions = hasSelectedStore && hasStoreData && backendHeatmap.length > 0 && heatmapDateKeys.length > 0;

  const handleGeneratePredictions = async () => {
    if (!hasSelectedStore || !hasStoreData) {
      return;
    }

    setIsLoading(true);
    setPredictMessage('');
    setPredictProgress(6);
    setPredictStage('Scanning historical sales');

    const predictionStages = [
      'Scanning historical sales',
      'Extracting seasonality signals',
      'Encoding weather and holiday features',
      'Running CatBoost inference',
      'Calibrating product-level demand',
      'Preparing dashboard outputs',
    ];

    const progressTimer = window.setInterval(() => {
      setPredictProgress((current) => {
        if (current >= 94) return current;
        const next = current + (current < 40 ? 3 : current < 75 ? 2 : 1);
        const stageIndex = Math.min(
          predictionStages.length - 1,
          Math.floor((next / 95) * predictionStages.length)
        );
        setPredictStage(predictionStages[stageIndex]);
        return next;
      });
    }, 180);

    const response = await predict(selectedStoreId);
    window.clearInterval(progressTimer);
    setPredictProgress(100);
    setPredictStage('Completed');

    if (response.status_code === 200 && Array.isArray(response.data)) {
      const { dateKeys, rows } = buildHeatmapFromPredictions(response.data);
      setHeatmapDateKeys(dateKeys);
      setBackendHeatmap(rows);
      setLastPredictionDate(new Date());
      setPredictMessage('Prediccion generada correctamente.');
    } else {
      setPredictMessage(response.message || 'No se pudo generar la prediccion.');
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {!hasSelectedStore ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <h3 className="text-lg font-semibold mb-2">No hay sucursal seleccionada</h3>
          <p className="text-sm text-muted-foreground">
            Crea o selecciona una sucursal para habilitar las predicciones.
          </p>
        </div>
      ) : isCheckingStoreData ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Verificando datos disponibles para predicciones...
        </div>
      ) : !hasStoreData ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <h3 className="text-lg font-semibold mb-2">Sin datos cargados en la sucursal</h3>
          <p className="text-sm text-muted-foreground">
            Carga un archivo en la sucursal seleccionada para ver o generar predicciones.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-sm font-semibold text-card-foreground">
              Fecha de la ultima prediccion: {formatLastPredictionDate(lastPredictionDate)}
            </h3>
            <button
              onClick={handleGeneratePredictions}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? 'Generando predicciones...' : 'Generar predicciones'}
            </button>
          </div>

          {isLoading && (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{predictStage}</span>
                <span>{predictProgress}%</span>
              </div>
              <Progress value={predictProgress} className="h-2" />
            </div>
          )}

          {predictMessage && (
            <p className="text-xs text-muted-foreground">{predictMessage}</p>
          )}
          {!hasPredictions ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-lg font-semibold mb-2">
                No hay predicciones generadas
              </h3>
              <p className="text-sm text-muted-foreground">
                Genera predicciones para visualizar análisis y demanda estimada.
              </p>
            </div>
          ) : (
            <>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, label: 'Ventas Totales Predichas', value: totalPredicted.toLocaleString(), sub: 'Proximos 7 dias' },
                  { icon: Calendar, label: 'Dia de Mayor Demanda', value: highestDay.day, sub: `${highestDay.predicted.toLocaleString()} unidades` },
                  { icon: Table, label: 'Productos en Analisis', value: String(heatmapData.length), sub: 'Incluidos en el mapa de calor' },
                ].map((kpi, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl border border-border shadow-card p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <kpi.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
                    </div>
                    <div className="text-xl font-bold text-card-foreground">{kpi.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Heatmap */}
              <div className="bg-card rounded-xl border border-border shadow-card p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-4 inline-flex items-center gap-1.5">
                  <span>Mapa de Calor de Demanda</span>
                  <UiTooltip>
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
                      Intensidad de demanda predicha por producto y por fecha real de pronóstico. Tonos más fuertes representan mayor demanda.
                    </TooltipContent>
                  </UiTooltip>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left font-medium text-muted-foreground pb-2">Producto</th>
                        {heatmapDateKeys.map((dateIso, index) => (
                          <th key={dateIso} className="text-center font-medium text-muted-foreground pb-2 whitespace-nowrap">{formatPredictionHeaderDate(dateIso, index)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.map(row => (
                        <tr key={row.product}>
                          <td className="py-1 pr-3 font-medium text-foreground">{row.product}</td>
                          {heatmapDateKeys.map(dateIso => {
                            const value = row.values[dateIso] || 0;
                            return (
                              <td key={`${row.product}-${dateIso}`} className="p-1 text-center">
                                <span className={`inline-block min-w-10 h-7 px-1 leading-7 rounded ${getHeatColor(value)}`}>
                                  {value}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Demand Chart */}
              <div className="bg-card rounded-xl border border-border shadow-card p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-4 inline-flex items-center gap-1.5">
                  <span>Demanda Diaria Predicha</span>
                  <UiTooltip>
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
                      Evolución de la demanda estimada por día para la próxima semana.
                    </TooltipContent>
                  </UiTooltip>
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={DAILY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <defs>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="predicted" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#predGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

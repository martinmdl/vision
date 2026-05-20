import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, LayoutGrid, Table } from 'lucide-react';
import { predict, type PredictionItem } from '@/api/services/mvp';

const DAILY_DATA = [
  { day: 'Lun', predicted: 1240 },
  { day: 'Mar', predicted: 1180 },
  { day: 'Mie', predicted: 1350 },
  { day: 'Jue', predicted: 1290 },
  { day: 'Vie', predicted: 1580 },
  { day: 'Sab', predicted: 1820 },
  { day: 'Dom', predicted: 1440 },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAYS_LABEL: Record<(typeof DAYS)[number], string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mie',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sab',
  sun: 'Dom',
};

type HeatmapRow = {
  product: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
};

function getDayKey(fecha: string): (typeof DAYS)[number] {
  const d = new Date(fecha).getDay();
  return (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[d];
}

function buildHeatmapFromPredictions(items: PredictionItem[]): HeatmapRow[] {
  const grouped = new Map<string, HeatmapRow>();

  for (const item of items) {
    if (!grouped.has(item.nombre)) {
      grouped.set(item.nombre, {
        product: item.nombre,
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        sun: 0,
      });
    }

    const key = getDayKey(item.fecha_prediccion);
    const row = grouped.get(item.nombre)!;
    row[key] += Math.round(item.pred_cantidad || 0);
  }

  return Array.from(grouped.values())
    .sort((a, b) => {
      const totalA = DAYS.reduce((sum, day) => sum + a[day], 0);
      const totalB = DAYS.reduce((sum, day) => sum + b[day], 0);
      return totalB - totalA;
    })
    .slice(0, 12);
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
  selectedStoreId: string;
}

export default function PredictionsView({ selectedStoreId }: PredictionsViewProps) {
  const [view, setView] = useState<'aggregated' | 'detailed'>('aggregated');
  const [isLoading, setIsLoading] = useState(false);
  const [lastPredictionDate, setLastPredictionDate] = useState<Date | null>(null);
  const [backendHeatmap, setBackendHeatmap] = useState<HeatmapRow[]>([]);
  const [predictMessage, setPredictMessage] = useState<string>('');

  const heatmapData = backendHeatmap;

  const totalPredicted = DAILY_DATA.reduce((sum, d) => sum + d.predicted, 0);
  const highestDay = DAILY_DATA.reduce((max, d) => d.predicted > max.predicted ? d : max, DAILY_DATA[0]);
  const hasPredictions = backendHeatmap.length > 0;

  const handleGeneratePredictions = async () => {
    setIsLoading(true);
    setPredictMessage('');

    const response = await predict(selectedStoreId);

    if (response.status_code === 200 && Array.isArray(response.data)) {
      setBackendHeatmap(buildHeatmapFromPredictions(response.data));
      setLastPredictionDate(new Date());
      setPredictMessage('Prediccion generada correctamente.');
    } else {
      setPredictMessage(response.message || 'No se pudo generar la prediccion.');
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-semibold text-card-foreground">
          Fecha de la ultima prediccion: {formatLastPredictionDate(lastPredictionDate)}
        </h3>
        <button
          onClick={handleGeneratePredictions}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? 'Generando...' : 'Generar predicciones'}
        </button>
      </div>

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
              {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('aggregated')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            view === 'aggregated' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Resumen
        </button>
        <button
          onClick={() => setView('detailed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            view === 'detailed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Table className="w-3.5 h-3.5" /> Detallado
        </button>
      </div>

      {view === 'aggregated' ? (
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

          {/* Daily Demand Chart */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Demanda Diaria Predicha</h3>
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

          {/* Heatmap */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Mapa de Calor de Demanda</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-muted-foreground pb-2">Producto</th>
                      {DAYS.map(d => (
                        <th key={d} className="text-center font-medium text-muted-foreground pb-2 capitalize">{DAYS_LABEL[d]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map(row => (
                      <tr key={row.product}>
                        <td className="py-1 pr-3 font-medium text-foreground">{row.product}</td>
                        {DAYS.map(d => (
                          <td key={d} className="p-1 text-center">
                            <span className={`inline-block w-8 h-7 leading-7 rounded ${getHeatColor(row[d] as number)}`}>
                              {row[d]}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </>
      ) : (
        /* Detailed Table View */
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Predicciones Detalladas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-2">Producto</th>
                  {DAYS.map(d => (
                    <th key={d} className="text-center font-medium text-muted-foreground py-2 capitalize">{DAYS_LABEL[d]}</th>
                  ))}
                  <th className="text-right font-medium text-muted-foreground py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => {
                  const total = DAYS.reduce((s, d) => s + (row[d] as number), 0);
                  return (
                    <tr key={row.product} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 font-medium text-foreground">{row.product}</td>
                      {DAYS.map(d => (
                        <td key={d} className="text-center text-muted-foreground py-2">{row[d]}</td>
                      ))}
                      <td className="text-right font-semibold text-foreground py-2">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
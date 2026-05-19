import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Trash2,
  Copy,
  Settings,
  Filter,
  Download,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

import type { Metric } from '@/types/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CHART_COLOR = 'hsl(243, 75%, 59%)';
const CHART_COLOR_GREEN = 'hsl(152, 69%, 41%)';
const CHART_COLOR_RED = 'hsl(0, 72%, 51%)';

const PIE_COLORS = [
  'hsl(243, 75%, 59%)',
  'hsl(152, 69%, 41%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(199, 89%, 48%)',
];

const CATEGORY_LABELS: Record<string, string> = {
  finance: 'finanzas',
  product: 'producto',
  weather: 'clima',
  holidays: 'feriados',
  promotions: 'promociones',
  operations: 'operaciones',
  customer: 'cliente',
};

interface MetricCardProps {
  metric?: Metric;

  title?: string;
  category?: string;
  error?: string;
  isLoading?: boolean;
  hasData?: boolean;
  loadingText?: string;
  emptyText?: string;
  children?: ReactNode;

  onRemove?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

function MetricActions({
  metric,
  onRemove,
  onDuplicate,
}: {
  metric: Metric;
  onRemove?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded-md hover:bg-muted transition-all">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem>
          <Settings className="w-3.5 h-3.5 mr-2" />
          Editar configuración
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onDuplicate?.(metric.id)}>
          <Copy className="w-3.5 h-3.5 mr-2" />
          Duplicar
        </DropdownMenuItem>

        <DropdownMenuItem>
          <BarChart3 className="w-3.5 h-3.5 mr-2" />
          Cambiar tipo de gráfico
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Filter className="w-3.5 h-3.5 mr-2" />
          Aplicar filtros
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Download className="w-3.5 h-3.5 mr-2" />
          Exportar CSV
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onRemove?.(metric.id)}
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MiniChart({
  data,
  type,
}: {
  data: Metric['data'];
  type: Metric['chartType'];
}) {
  const color = type === 'bar' ? CHART_COLOR : CHART_COLOR_GREEN;

  if (type === 'pie' || type === 'donut') {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={type === 'donut' ? 18 : 0}
            outerRadius={32}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'hbar') {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar dataKey="value" fill={CHART_COLOR} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={64}>
      {type === 'bar' ? (
        <BarChart data={data}>
          <Bar dataKey="value" fill={CHART_COLOR} radius={[2, 2, 0, 0]} />
        </BarChart>
      ) : type === 'line' ? (
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      ) : (
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.15}
          />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

export default function MetricCard(props: MetricCardProps) {
  const {
    metric,
    title,
    category,
    error,
    isLoading,
    hasData,
    loadingText = 'Cargando métrica...',
    emptyText = 'No hay datos para mostrar.',
    children,
    onRemove,
    onDuplicate,
  } = props;

  if (error) return null;

  const resolvedTitle = metric?.title ?? title ?? 'Métrica';
  const resolvedCategory =
    metric
      ? CATEGORY_LABELS[metric.category] ?? metric.category
      : category;

  const resolvedHasData =
    metric ? metric.data.length > 0 : hasData;

  const isPositive = metric ? metric.change >= 0 : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          {resolvedCategory && (
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {resolvedCategory}
            </span>
          )}
          <h3 className="text-sm font-semibold text-card-foreground">
            {resolvedTitle}
          </h3>
        </div>

        {metric && (
          <MetricActions
            metric={metric}
            onRemove={onRemove}
            onDuplicate={onDuplicate}
          />
        )}
      </div>

      {metric && (
        <div className="flex items-end gap-2 mb-3">
          <span className="text-2xl font-bold text-card-foreground">
            {metric.value}
          </span>

          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
              isPositive
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {isPositive ? '+' : ''}
            {metric.change}%
          </span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{loadingText}</p>
      ) : resolvedHasData ? (
        metric ? (
          <MiniChart
            data={metric.data}
            type={metric.chartType}
          />
        ) : (
          children
        )
      ) : (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}
    </motion.div>
  );
}
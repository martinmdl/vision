import { MoreHorizontal, Trash2, Copy, Settings, Filter, Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  RadialBarChart, RadialBar,
  ComposedChart, XAxis, YAxis, ResponsiveContainer,
} from 'recharts';
import type { Metric } from '@/types/store';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MetricCardProps {
  metric: Metric;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const CHART_COLOR = 'hsl(243, 75%, 59%)';
const CHART_COLOR_GREEN = 'hsl(152, 69%, 41%)';
const CHART_COLOR_RED = 'hsl(0, 72%, 51%)';
const PIE_COLORS = ['hsl(243, 75%, 59%)', 'hsl(152, 69%, 41%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(199, 89%, 48%)'];
const CATEGORY_LABELS: Record<string, string> = {
  finance: 'finanzas',
  product: 'producto',
  weather: 'clima',
  holidays: 'feriados',
  promotions: 'promociones',
  operations: 'operaciones',
  customer: 'cliente',
};

function MiniChart({ data, type }: { data: Metric['data']; type: Metric['chartType'] }) {
  const color = type === 'bar' ? CHART_COLOR : CHART_COLOR_GREEN;

  if (type === 'pie' || type === 'donut') {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name"
            innerRadius={type === 'donut' ? 18 : 0}
            outerRadius={32} paddingAngle={2}
          >
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'hbar') {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar dataKey="value" fill={CHART_COLOR} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'candle') {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <ComposedChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey={(d: any) => [d.low, d.high]} fill="hsl(220, 9%, 70%)" barSize={2} />
          <Bar
            dataKey={(d: any) => [d.open, d.close]}
            barSize={8}
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              const fill = payload.close >= payload.open ? CHART_COLOR_GREEN : CHART_COLOR_RED;
              return <rect x={x} y={y} width={width} height={Math.abs(height) || 1} fill={fill} rx={1} />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'radar') {
    return (
      <ResponsiveContainer width="100%" height={90}>
        <RadarChart data={data} outerRadius={36}>
          <PolarGrid stroke="hsl(220, 13%, 91%)" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 8, fill: 'hsl(220, 9%, 46%)' }} />
          <Radar dataKey="value" stroke={CHART_COLOR} fill={CHART_COLOR} fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'radial') {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <RadialBarChart innerRadius="60%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={6} fill={CHART_COLOR} background={{ fill: 'hsl(220, 13%, 91%)' }} />
        </RadialBarChart>
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
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      ) : (
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${type})`} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

export default function MetricCard({ metric, onRemove, onDuplicate }: MetricCardProps) {
  const isPositive = metric.change >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5 relative group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{CATEGORY_LABELS[metric.category] ?? metric.category}</span>
          <h3 className="text-sm font-semibold text-card-foreground">{metric.title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem><Settings className="w-3.5 h-3.5 mr-2" /> Editar configuracion</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(metric.id)}><Copy className="w-3.5 h-3.5 mr-2" /> Duplicar</DropdownMenuItem>
            <DropdownMenuItem><BarChart3 className="w-3.5 h-3.5 mr-2" /> Cambiar tipo de grafico</DropdownMenuItem>
            <DropdownMenuItem><Filter className="w-3.5 h-3.5 mr-2" /> Aplicar filtros</DropdownMenuItem>
            <DropdownMenuItem><Download className="w-3.5 h-3.5 mr-2" /> Exportar CSV</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onRemove(metric.id)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl font-bold text-card-foreground tracking-tight">{metric.value}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
          isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositive ? '+' : ''}{metric.change}%
        </span>
      </div>

      {/* Chart */}
      <MiniChart data={metric.data} type={metric.chartType} />
    </motion.div>
  );
}

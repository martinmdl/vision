import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Trash2,
  Copy,
  Settings,
  Filter,
  Download,
  BarChart3,
    Info,
} from 'lucide-react';

import type { Metric } from '@/types/store';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';


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
  metric: Metric;

  onRemove?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

function MetricActions({
  metricId,
  onRemove,
  onDuplicate,
}: {
  metricId: string;
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

      <DropdownMenuContent
        align="end"
        className="w-48"
      >
        <DropdownMenuItem>
          <Settings className="w-3.5 h-3.5 mr-2" />
          Editar configuración
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            onDuplicate?.(metricId)
          }
        >
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
          onClick={() =>
            onRemove?.(metricId)
          }
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MetricCard({
  metric,
  onRemove,
  onDuplicate,
}: MetricCardProps) {
  if (metric.error) {
    return null;
  }

  const resolvedCategory =
    CATEGORY_LABELS[metric.category] ??
    metric.category;

  const isPositive = metric.change >= 0;

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {resolvedCategory}
          </span>

          <span className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-card-foreground">
            {metric.title}
          </h3>
          {metric.titleInfo && (
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
                  {metric.titleInfo}
                </TooltipContent>
              </Tooltip>
            )}
            </span>

        </div>

        <MetricActions
          metricId={metric.id}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
        />
      </div>

      <div className="flex items-end gap-2 mb-4">
        <span className="text-2xl font-bold text-card-foreground">
        </span>
      </div>

      {metric.isLoading ? (
        <p className="text-xs text-muted-foreground">
          Cargando métrica...
        </p>
      ) : metric.hasData ? (
        metric.renderContent?.()
      ) : (
        <p className="text-xs text-muted-foreground">
          No hay datos para mostrar.
        </p>
      )}
    </motion.div>
  );
}
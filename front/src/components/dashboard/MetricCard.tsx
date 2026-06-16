import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Trash2,
  Download,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';

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
  metricTitle,
  exportRows,
  exportFileName,
  onRemove,
}: {
  metricId: string;
  metricTitle: string;
  exportRows?: Array<Record<string, string | number | boolean | null>>;
  exportFileName?: string;
  onRemove?: (id: string) => void;
}) {
  const getRowsForExport = () => {
    if (exportRows && exportRows.length > 0) {
      return exportRows;
    }

    return [{ metric: metricTitle }];
  };

  const getExportBaseName = () => {
    if (exportFileName && exportFileName.trim().length > 0) {
      return exportFileName.trim();
    }

    return metricTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'metric';
  };

  const exportCsv = () => {
    const rows = getRowsForExport();
    const worksheet = utils.json_to_sheet(rows);
    const csv = utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${getExportBaseName()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportXlsx = () => {
    const rows = getRowsForExport();
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Metrica');
    writeFile(workbook, `${getExportBaseName()}.xlsx`);
  };

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
        <DropdownMenuItem onClick={exportCsv}>
          <Download className="w-3.5 h-3.5 mr-2" />
          Exportar a CSV
        </DropdownMenuItem>

        <DropdownMenuItem onClick={exportXlsx}>
          <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
          Exportar a XLSX
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
}: MetricCardProps) {
  if (metric.error) {
    return null;
  }

  const resolvedCategory =
    CATEGORY_LABELS[metric.category] ??
    metric.category;

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
        <div className="cursor-grab active:cursor-grabbing">
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
          metricTitle={metric.title}
          exportRows={metric.exportRows}
          exportFileName={metric.exportFileName}
          onRemove={onRemove}
        />
      </div>

      <div className="flex items-end gap-2 mb-4">
        <span className="text-2xl font-bold text-card-foreground">
          {metric.value}
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

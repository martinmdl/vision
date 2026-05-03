import { Columns2, LayoutList, Calendar } from 'lucide-react';
import type { GridColumns, DateRange, ViewMode } from '@/types/store';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface TopBarProps {
  gridColumns: GridColumns;
  onGridChange: (cols: GridColumns) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  viewMode: ViewMode;
  storeName: string;
}

export default function TopBar({ gridColumns, onGridChange, dateRange, onDateRangeChange, viewMode, storeName }: TopBarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">{storeName}</h2>
        <p className="text-xs text-muted-foreground capitalize">Vista de {viewMode === 'metrics' ? 'metricas' : 'predicciones'}</p>
      </div>

      <div className="flex items-center gap-3">
        {viewMode === 'metrics' && (
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => onGridChange(1)}
              className={`p-1.5 rounded-md transition-colors ${gridColumns === 1 ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => onGridChange(2)}
              className={`p-1.5 rounded-md transition-colors ${gridColumns === 2 ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <Columns2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={v => onDateRangeChange(v as DateRange)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Ultimos 7 dias</SelectItem>
              <SelectItem value="30d">Ultimos 30 dias</SelectItem>
              <SelectItem value="90d">Ultimos 90 dias</SelectItem>
              <SelectItem value="custom">Rango personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

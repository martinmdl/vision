import { Calendar, BarChart3, TrendingUp } from 'lucide-react';
import type { DateRange, ViewMode } from '@/types/store';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface TopBarProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  storeName: string;
}

export default function TopBar({
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewChange,
  storeName,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between mb-6 border-r-4 border-b-4 border-gray-500 sticky top-0 z-50 bg-white p-12 rounded">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">{storeName}</h2>
        <p className="text-xs text-muted-foreground capitalize">Vista de {viewMode === 'metrics' ? 'metricas' : 'predicciones'}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <button
            onClick={() => onViewChange('metrics')}
            className={`h-8 px-3 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'metrics' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            type="button"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Metricas
          </button>
          <button
            onClick={() => onViewChange('predictions')}
            className={`h-8 px-3 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'predictions' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            type="button"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Predicciones
          </button>
        </div>

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

import { Calendar, BarChart3, TrendingUp, Database } from 'lucide-react';
import { useState } from 'react';
import type { DateRange, ViewMode } from '@/types/store';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import DateRangePickerModal from './DateRangePickerModal';
import { Button } from '../ui/button';

interface TopBarProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  storeName: string;
  customDateStart?: string;
  customDateEnd?: string;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
}

export default function TopBar({
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewChange,
  storeName,
  customDateStart,
  customDateEnd,
  onCustomDateChange,
}: TopBarProps) {
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const handleDateRangeSelect = (value: string) => {
    console.log(isDateModalOpen)
    if (value !== 'custom') {
      onDateRangeChange(value as DateRange); 
    }
  };

  const handleCustomDateConfirm = (startDate: string, endDate: string) => {
    onCustomDateChange?.(startDate, endDate);
    onDateRangeChange('custom');
  };

  const viewLabel = viewMode === 'metrics'
    ? 'Métricas'
    : viewMode === 'predictions'
      ? 'Predicciones'
      : 'Datos';

  return (
    <div className="flex items-center justify-between mb-6 sticky top-0 z-50 bg-white p-8 border border-gray-300 rounded-2xl shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">{storeName}</h2>
        <p className="text-xs text-muted-foreground">Vision | {storeName} | {viewLabel}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-muted border border-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => onViewChange('data')}
            className={`h-8 px-3 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'data' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            type="button"
          >
            <Database className="w-3.5 h-3.5" /> Datos
          </button>
          <button
            onClick={() => onViewChange('metrics')}
            className={`h-8 px-3 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'metrics' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            type="button"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Métricas
          </button>
          <button
            onClick={() => onViewChange('predictions')}
            className={`h-8 px-3 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'predictions' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            type="button"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Predicciones
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={handleDateRangeSelect}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Ultimos 7 dias</SelectItem>
              <SelectItem value="30d">Ultimos 30 dias</SelectItem>
              <SelectItem value="90d">Ultimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button value="custom" onClick={() => setIsDateModalOpen(true)}>Rango personalizado</Button>
        </div>

        <DateRangePickerModal
          open={isDateModalOpen}
          onOpenChange={setIsDateModalOpen}
          onConfirm={handleCustomDateConfirm}
          initialStartDate={customDateStart}
          initialEndDate={customDateEnd}
        />
      </div>
    </div>
  );
}

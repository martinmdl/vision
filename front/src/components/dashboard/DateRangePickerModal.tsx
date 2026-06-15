import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange as DayPickerDateRange } from 'react-day-picker';

interface DateRangePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function DateRangePickerModal({
  open,
  onOpenChange,
  onConfirm,
  initialStartDate,
  initialEndDate,
}: DateRangePickerModalProps) {
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>();
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setError('');
      if (initialStartDate && initialEndDate) {
        setDateRange({
          from: new Date(initialStartDate),
          to: new Date(initialEndDate),
        });
        setStartDateInput(initialStartDate);
        setEndDateInput(initialEndDate);
      } else {
        setDateRange(undefined);
        setStartDateInput('');
        setEndDateInput('');
      }
    }
  }, [open, initialStartDate, initialEndDate]);

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toISOString().slice(0, 10);
  };

  const handleDateRangeChange = (range: DayPickerDateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setStartDateInput(formatDateForInput(range.from));
    }
    if (range?.to) {
      setEndDateInput(formatDateForInput(range.to));
    }
  };

  const handleStartDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDateInput(value);
    if (value && dateRange?.to) {
      const date = new Date(value);
      setDateRange({ from: date, to: dateRange.to });
    }
  };

  const handleEndDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDateInput(value);
    if (value && dateRange?.from) {
      const date = new Date(value);
      setDateRange({ from: dateRange.from, to: date });
    }
  };

  const handleConfirm = () => {
    setError('');

    if (!startDateInput || !endDateInput) {
      setError('Ingresa ambas fechas (inicio y fin)');
      return;
    }

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('Formato de fecha inválido. Usa YYYY-MM-DD');
      return;
    }

    if (startDate > endDate) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin');
      return;
    }

    const maxRangeMs = 730 * 24 * 60 * 60 * 1000; // 2 years
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      setError('El rango no puede superar 730 días (2 años)');
      return;
    }

    onConfirm(startDateInput, endDateInput);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setError('');
    setDateRange(undefined);
    setStartDateInput('');
    setEndDateInput('');
    onOpenChange(false);
  };

  const dayCount = dateRange?.from && dateRange?.to
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Seleccionar rango de fechas</DialogTitle>
          <DialogDescription>
            Elige las fechas usando el calendario o ingresalas manualmente en los campos de texto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Single Calendar with Range Mode */}
          <div className="flex justify-center rounded-lg border border-border bg-card p-2">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeChange}
              className="justify-center"
            />
          </div>

          {/* Manual Date Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="startDate" className="text-xs font-medium text-foreground">
                Fecha de inicio
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDateInput}
                onChange={handleStartDateInputChange}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="endDate" className="text-xs font-medium text-foreground">
                Fecha de fin
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDateInput}
                onChange={handleEndDateInputChange}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Date Summary */}
          {startDateInput && endDateInput && !error && (
            <div className="rounded-lg bg-accent/30 p-3">
              <p className="text-sm font-medium text-foreground">
                Rango: {startDateInput} → {endDateInput}
              </p>
              <p className="text-xs text-muted-foreground">
                ({dayCount} {dayCount === 1 ? 'día' : 'días'})
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} type="button">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} type="button">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

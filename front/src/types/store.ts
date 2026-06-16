import { ReactNode } from "react";

export interface Store {
  id: number;
  name: string;
  files: string[];
}

export interface Metric {
  id: string;

  title: string;
  titleInfo: string;
  category: string;

  value: string;
  change: number;

  isLoading?: boolean;
  error?: string;
  hasData?: boolean;

  renderContent?: () => ReactNode;
}

export type ViewMode = 'metrics' | 'predictions' | 'data';
export type GridColumns = 1 | 2;
export type DateRange = 'all' | '7d' | '30d' | '90d' | 'custom';

export const METRIC_CATEGORIES = [
  { key: 'finance', label: 'Finanzas', items: ['Ingresos', 'Ganancia', 'Margen Bruto', 'Margen Neto'] },
  { key: 'product', label: 'Producto', items: ['Unidades Vendidas', 'Nivel de Stock', 'Rotacion', 'Mas Vendidos'] },
  { key: 'weather', label: 'Clima', items: ['Impacto de Temperatura', 'Correlacion con Lluvia', 'Tendencias Estacionales'] },
  { key: 'holidays', label: 'Feriados', items: ['Rendimiento en Feriados', 'Linea Base sin Feriado', 'Incremento por Feriado'] },
  { key: 'promotions', label: 'Promociones', items: ['Impacto de Descuento', 'ROI de Campana', 'Incremento por Promo'] },
  { key: 'operations', label: 'Operaciones', items: ['Niveles de Inventario', 'Quiebres de Stock', 'Frecuencia de Reposicion'] },
  { key: 'customer', label: 'Cliente', items: ['Frecuencia de Visita', 'Tamano de Ticket', 'Retencion de Clientes'] },
] as const;

export interface Store {
  id: string;
  name: string;
  files: string[];
}

export interface Metric {
  id: string;
  title: string;
  category: string;
  value: string;
  change: number;
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'donut' | 'hbar' | 'candle' | 'radar' | 'radial';
  data: { name: string; value: number; open?: number; close?: number; high?: number; low?: number }[];
}

export type ViewMode = 'metrics' | 'predictions';
export type GridColumns = 1 | 2;
export type DateRange = '7d' | '30d' | '90d' | 'custom';

export const METRIC_CATEGORIES = [
  { key: 'finance', label: 'Finance', items: ['Revenue', 'Profit', 'Gross Margin', 'Net Margin'] },
  { key: 'product', label: 'Product', items: ['Units Sold', 'Stock Level', 'Rotation Rate', 'Top Sellers'] },
  { key: 'weather', label: 'Weather', items: ['Temperature Impact', 'Rain Correlation', 'Seasonal Trends'] },
  { key: 'holidays', label: 'Holidays', items: ['Holiday Performance', 'Non-Holiday Baseline', 'Holiday Uplift'] },
  { key: 'promotions', label: 'Promotions', items: ['Discount Impact', 'Campaign ROI', 'Promo Uplift'] },
  { key: 'operations', label: 'Operations', items: ['Inventory Levels', 'Stockouts', 'Restock Frequency'] },
  { key: 'customer', label: 'Customer', items: ['Visit Frequency', 'Basket Size', 'Customer Retention'] },
] as const;

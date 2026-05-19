import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';

import type {
  TopSoldProductItem,
  TopProfitableProductItem,
  WeatherImpactIncomeItem,
  CalendarImpactIncomeItem,
} from '@/api/services/mvp';

interface TopProductsChartProps {
  data: TopSoldProductItem[];
}

interface TopProfitableProductsChartProps {
  data: TopProfitableProductItem[];
}

interface WeatherImpactIncomeChartProps {
  data: WeatherImpactIncomeItem[];
}

interface CalendarImpactIncomeChartProps {
  data: CalendarImpactIncomeItem[];
}

interface RankingBarChartProps<T extends { name: string }> {
  data: T[];
  valueKey: keyof T;
  tooltipLabel: string;
  valueFormatter?: (value: number) => string;
}

function RankingBarChart<T extends { name: string }>({
  data,
  valueKey,
  tooltipLabel,
  valueFormatter,
}: RankingBarChartProps<T>) {
  const formatter = valueFormatter ?? ((value: number) => `${value}`);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <XAxis
          type="number"
          tick={{
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />

        <YAxis
          dataKey="name"
          type="category"
          width={75}
          tick={{
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />

        <Tooltip
          formatter={(value: number) => formatter(Number(value))}
          labelFormatter={(label: string) => `${tooltipLabel}: ${label}`}
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />

        <Bar dataKey={String(valueKey)} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={`hsl(var(--chart-${(i % 5) + 1}))`}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({
  data,
}: TopProductsChartProps) {
  return (
    <RankingBarChart
      data={data}
      valueKey="demand"
      tooltipLabel="Producto"
    />
  );
}

export function TopProfitableProductsChart({
  data,
}: TopProfitableProductsChartProps) {
  return (
    <RankingBarChart
      data={data}
      valueKey="profit"
      tooltipLabel="Producto"
      valueFormatter={(value) => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`}
    />
  );
}

export function WeatherImpactIncomeChart({
  data,
}: WeatherImpactIncomeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 10, right: 10 }}>
        <XAxis
          dataKey="month"
          tick={{
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />

        <YAxis
          tick={{
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />

        <Tooltip
          formatter={(value: number) => `$${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`}
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />

        <Legend
          wrapperStyle={{
            fontSize: 11,
          }}
        />

        <Bar dataKey="rainy_income" name="Dia Lluvioso" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="clear_income" name="Dia Despejado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CalendarImpactIncomeChart({
  data,
}: CalendarImpactIncomeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 10, right: 10 }}>
        <XAxis
          dataKey="month"
          tick={{
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />

        <YAxis
          tick={{
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />

        <Tooltip
          formatter={(value: number) => `$${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`}
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />

        <Legend
          wrapperStyle={{
            fontSize: 11,
          }}
        />

        <Bar dataKey="festive_income" name="Festivo/Feriado/Efemeride" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="normal_income" name="Dia Normal" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="weekend_income" name="Fin de Semana" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
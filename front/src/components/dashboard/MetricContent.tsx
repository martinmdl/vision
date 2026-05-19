import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

import type { TopSoldProductItem } from '@/api/services/mvp';

interface TopProductsChartProps {
  data: TopSoldProductItem[];
}

export function TopProductsChart({
  data,
}: TopProductsChartProps) {
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
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />

        <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
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
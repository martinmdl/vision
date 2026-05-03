import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, Calendar, Package, LayoutGrid, Table } from 'lucide-react';

const DAILY_DATA = [
  { day: 'Mon', predicted: 1240 },
  { day: 'Tue', predicted: 1180 },
  { day: 'Wed', predicted: 1350 },
  { day: 'Thu', predicted: 1290 },
  { day: 'Fri', predicted: 1580 },
  { day: 'Sat', predicted: 1820 },
  { day: 'Sun', predicted: 1440 },
];

const TOP_PRODUCTS = [
  { name: 'Organic Milk 1L', demand: 342 },
  { name: 'Sourdough Bread', demand: 298 },
  { name: 'Free Range Eggs', demand: 276 },
  { name: 'Avocados (3pk)', demand: 251 },
  { name: 'Greek Yogurt', demand: 234 },
  { name: 'Bananas (bunch)', demand: 218 },
  { name: 'Chicken Breast', demand: 203 },
  { name: 'Sparkling Water', demand: 195 },
  { name: 'Mixed Salad', demand: 187 },
  { name: 'Pasta Sauce', demand: 172 },
];

const HEATMAP_DATA = [
  { product: 'Organic Milk', mon: 48, tue: 45, wed: 52, thu: 49, fri: 58, sat: 62, sun: 50 },
  { product: 'Sourdough', mon: 42, tue: 39, wed: 44, thu: 41, fri: 50, sat: 55, sun: 43 },
  { product: 'Eggs', mon: 38, tue: 36, wed: 42, thu: 39, fri: 46, sat: 52, sun: 40 },
  { product: 'Avocados', mon: 35, tue: 32, wed: 38, thu: 36, fri: 42, sat: 48, sun: 37 },
  { product: 'Yogurt', mon: 33, tue: 30, wed: 36, thu: 34, fri: 40, sat: 44, sun: 35 },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function getHeatColor(val: number) {
  if (val >= 55) return 'bg-primary/80 text-primary-foreground';
  if (val >= 45) return 'bg-primary/50 text-primary-foreground';
  if (val >= 35) return 'bg-primary/20 text-foreground';
  return 'bg-primary/5 text-foreground';
}

export default function PredictionsView() {
  const [view, setView] = useState<'aggregated' | 'detailed'>('aggregated');
  const totalPredicted = DAILY_DATA.reduce((sum, d) => sum + d.predicted, 0);
  const highestDay = DAILY_DATA.reduce((max, d) => d.predicted > max.predicted ? d : max, DAILY_DATA[0]);

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('aggregated')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            view === 'aggregated' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Aggregated
        </button>
        <button
          onClick={() => setView('detailed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            view === 'detailed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Table className="w-3.5 h-3.5" /> Detailed
        </button>
      </div>

      {view === 'aggregated' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, label: 'Total Predicted Sales', value: totalPredicted.toLocaleString(), sub: 'Next 7 days' },
              { icon: Calendar, label: 'Highest Demand Day', value: highestDay.day, sub: `${highestDay.predicted.toLocaleString()} units` },
              { icon: Package, label: 'Most Demanded', value: TOP_PRODUCTS[0].name, sub: `${TOP_PRODUCTS[0].demand} units` },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border shadow-card p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <kpi.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
                </div>
                <div className="text-xl font-bold text-card-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Daily Demand Chart */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Predicted Daily Demand</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={DAILY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="predicted" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#predGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Two-column: Top Products + Heatmap */}
          <div className="grid grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Top 10 Predicted Products</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={75} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
                    {TOP_PRODUCTS.map((_, i) => (
                      <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Demand Heatmap</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-muted-foreground pb-2">Product</th>
                      {DAYS.map(d => (
                        <th key={d} className="text-center font-medium text-muted-foreground pb-2 capitalize">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HEATMAP_DATA.map(row => (
                      <tr key={row.product}>
                        <td className="py-1 pr-3 font-medium text-foreground">{row.product}</td>
                        {DAYS.map(d => (
                          <td key={d} className="p-1 text-center">
                            <span className={`inline-block w-8 h-7 leading-7 rounded ${getHeatColor(row[d] as number)}`}>
                              {row[d]}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Detailed Table View */
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Detailed Predictions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-2">Product</th>
                  {DAYS.map(d => (
                    <th key={d} className="text-center font-medium text-muted-foreground py-2 capitalize">{d}</th>
                  ))}
                  <th className="text-right font-medium text-muted-foreground py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {HEATMAP_DATA.map(row => {
                  const total = DAYS.reduce((s, d) => s + (row[d] as number), 0);
                  return (
                    <tr key={row.product} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 font-medium text-foreground">{row.product}</td>
                      {DAYS.map(d => (
                        <td key={d} className="text-center text-muted-foreground py-2">{row[d]}</td>
                      ))}
                      <td className="text-right font-semibold text-foreground py-2">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

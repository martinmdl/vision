import { useState } from 'react';
import { MoreHorizontal, Trash2, Copy, Settings, Filter, Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer } from 'recharts';
import type { Metric } from '@/types/store';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MetricCardProps {
  metric: Metric;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const CHART_COLOR = 'hsl(243, 75%, 59%)';
const CHART_COLOR_GREEN = 'hsl(152, 69%, 41%)';

function MiniChart({ data, type }: { data: Metric['data']; type: Metric['chartType'] }) {
  const color = type === 'bar' ? CHART_COLOR : CHART_COLOR_GREEN;

  return (
    <ResponsiveContainer width="100%" height={64}>
      {type === 'bar' ? (
        <BarChart data={data}>
          <Bar dataKey="value" fill={CHART_COLOR} radius={[2, 2, 0, 0]} />
        </BarChart>
      ) : type === 'line' ? (
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      ) : (
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${type})`} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

export default function MetricCard({ metric, onRemove, onDuplicate }: MetricCardProps) {
  const isPositive = metric.change >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5 relative group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{metric.category}</span>
          <h3 className="text-sm font-semibold text-card-foreground">{metric.title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem><Settings className="w-3.5 h-3.5 mr-2" /> Edit Configuration</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(metric.id)}><Copy className="w-3.5 h-3.5 mr-2" /> Duplicate</DropdownMenuItem>
            <DropdownMenuItem><BarChart3 className="w-3.5 h-3.5 mr-2" /> Change Chart Type</DropdownMenuItem>
            <DropdownMenuItem><Filter className="w-3.5 h-3.5 mr-2" /> Apply Filters</DropdownMenuItem>
            <DropdownMenuItem><Download className="w-3.5 h-3.5 mr-2" /> Export CSV</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onRemove(metric.id)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl font-bold text-card-foreground tracking-tight">{metric.value}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
          isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositive ? '+' : ''}{metric.change}%
        </span>
      </div>

      {/* Chart */}
      <MiniChart data={metric.data} type={metric.chartType} />
    </motion.div>
  );
}

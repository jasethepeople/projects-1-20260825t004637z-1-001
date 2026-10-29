import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mockFitnessData } from '@/data/mockData';
import type { FitnessDataPoint } from '@/data/mockData';

interface FitnessChartProps {
  data?: FitnessDataPoint[];
}

interface ChartDataPoint {
  time: string;
  bestFitness: number;
  avgFitness: number;
  mutationRate: number;
  index: number;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${m}:${s}`;
}

function CustomTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-md border px-3 py-2 shadow-lg"
      style={{
        background: 'var(--bg-surface-elevated)',
        borderColor: 'var(--bg-border-hover)',
      }}
    >
      <p
        className="mb-1 text-[10px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div
            className="h-[2px] w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span
            className="text-[11px]"
            style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {entry.name}:
          </span>
          <span
            className="text-[11px] font-bold"
            style={{ color: entry.color, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {entry.name === 'Mutation Rate' ? `${entry.value}%` : entry.value.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FitnessChart({ data }: FitnessChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const source = data && data.length > 0 ? data : mockFitnessData;
    // Rolling 60-second window (last 60 data points)
    const windowed = source.slice(-60);
    return windowed.map((d, i) => ({
      time: formatTime(d.timestamp),
      bestFitness: d.bestFitness,
      avgFitness: d.avgFitness,
      mutationRate: d.mutationRate,
      index: i,
    }));
  }, [data]);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Chart area */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="gradBest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E040FB" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#E040FB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMutation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E676" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00E676" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E293B"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#1E293B' }}
              interval="preserveStartEnd"
              minTickGap={20}
            />

            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#1E293B' }}
              tickCount={5}
              width={30}
            />

            <Tooltip
              content={<CustomTooltipContent />}
              cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            <Area
              type="monotone"
              dataKey="bestFitness"
              name="Best Fitness"
              stroke="#00E5FF"
              strokeWidth={2}
              fill="url(#gradBest)"
              animationDuration={400}
              dot={false}
              activeDot={{ r: 3, stroke: '#00E5FF', strokeWidth: 2, fill: '#00E5FF' }}
            />

            <Area
              type="monotone"
              dataKey="avgFitness"
              name="Avg Fitness"
              stroke="#E040FB"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#gradAvg)"
              animationDuration={400}
              dot={false}
              activeDot={{ r: 3, stroke: '#E040FB', strokeWidth: 2, fill: '#E040FB' }}
            />

            <Area
              type="monotone"
              dataKey="mutationRate"
              name="Mutation Rate"
              stroke="#00E676"
              strokeWidth={1}
              strokeDasharray="2 2"
              fill="url(#gradMutation)"
              animationDuration={400}
              dot={false}
              activeDot={{ r: 3, stroke: '#00E676', strokeWidth: 2, fill: '#00E676' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend row */}
      <div className="mt-1 flex items-center justify-center gap-4">
        <LegendItem color="#00E5FF" label="BEST FITNESS" dashed={false} />
        <LegendItem color="#E040FB" label="AVG FITNESS" dashed />
        <LegendItem color="#00E676" label="MUTATION %" dotted />
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed, dotted }: { color: string; label: string; dashed?: boolean; dotted?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-[2px] w-4 rounded-full"
        style={{
          backgroundColor: color,
          backgroundImage: dotted
            ? 'repeating-linear-gradient(90deg, transparent, transparent 2px, ' + color + ' 2px, ' + color + ' 4px)'
            : undefined,
          ...(dashed && !dotted ? { backgroundImage: 'repeating-linear-gradient(90deg, ' + color + ', ' + color + ' 4px, transparent 4px, transparent 8px)' } : {}),
        }}
      />
      <span
        className="text-[9px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {label}
      </span>
    </div>
  );
}

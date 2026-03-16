'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useHistoricalRates, Period } from '@/hooks/useHistoricalRates';
import { getCurrency } from '@/lib/currencies';

interface Props {
  fromCurrency: string;
  toCurrency: string;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: '3D', value: '3D' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '1Y', value: '1Y' },
];

function formatXTick(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === '1Y') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  if (period === '3D') return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RateTrendChart({ fromCurrency, toCurrency }: Props) {
  const [period, setPeriod] = useState<Period>('30D');
  const { data, isLoading, isError } = useHistoricalRates(fromCurrency, toCurrency, period);
  const toCurrencyData = getCurrency(toCurrency);

  if (fromCurrency === toCurrency) return null;

  const minRate = data && data.length > 0 ? Math.min(...data.map((d) => d.rate)) * 0.997 : 0;
  const maxRate = data && data.length > 0 ? Math.max(...data.map((d) => d.rate)) * 1.003 : 1;

  const changePercent =
    data && data.length >= 2
      ? ((data[data.length - 1].rate - data[0].rate) / data[0].rate) * 100
      : null;

  const isPositive = changePercent == null || changePercent >= 0;
  const lineColor = isPositive ? '#3b82f6' : '#f87171';
  const glowColor = isPositive ? '#3b82f6' : '#f87171';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <h2 className="text-base font-bold text-slate-50 tracking-tight">
            {fromCurrency} / {toCurrency}
          </h2>
          {changePercent != null && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
              </span>
              <span className="text-xs text-slate-500">over {period}</span>
            </div>
          )}
          {data && data.length > 0 && (
            <p className="text-xs text-slate-600 mt-0.5">
              Latest: {data[data.length - 1].rate.toFixed(4)} {toCurrency}
            </p>
          )}
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 p-1 bg-slate-800 border border-slate-700/60 rounded-lg">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 focus:outline-none ${
                period === value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-56 rounded-xl bg-slate-800 animate-pulse" />
      ) : isError ? (
        <div className="h-56 flex items-center justify-center text-slate-600 text-sm">
          Failed to load chart data
        </div>
      ) : data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              {/* Glow filter */}
              <filter id="lineGlow" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Area gradient */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
                <stop offset="85%" stopColor={lineColor} stopOpacity={0.02} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => formatXTick(v, period)}
              tick={{ fontSize: 10, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minRate, maxRate]}
              tick={{ fontSize: 10, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => v.toFixed(3)}
            />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '0.75rem',
                boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)`,
                fontSize: '12px',
                padding: '10px 14px',
              }}
              labelStyle={{ fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}
              itemStyle={{ color: '#94a3b8' }}
              cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
              formatter={(value) => [
                `${toCurrencyData?.symbol ?? ''}${(value as number).toFixed(6)} ${toCurrency}`,
                `1 ${fromCurrency}`,
              ]}
              labelFormatter={(label) =>
                new Date(label as string).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={glowColor}
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
              filter="url(#lineGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-56 flex items-center justify-center text-slate-600 text-sm">
          No data available
        </div>
      )}
    </div>
  );
}

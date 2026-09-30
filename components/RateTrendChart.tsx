'use client';

import { useState, useId } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

// Parse "YYYY-MM-DD" as local date to avoid UTC-offset day shift
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatXTick(dateStr: string, period: Period): string {
  const d = parseLocalDate(dateStr);
  if (period === '1Y') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  if (period === '3D') return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RateTrendChart({ fromCurrency, toCurrency }: Props) {
  const uid = useId();
  const gradientId = `areaGradient-${uid}`;

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
  const last = data && data.length > 0 ? data[data.length - 1] : null;
  const axis = { fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-geist-sans)' };

  return (
    <div>
      {/* Summary + period toggle */}
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 t-label">
        <p className="text-ink-3 tabular-nums">
          {changePercent != null ? (
            <>
              <span className={isPositive ? 'text-up' : 'text-down'}>
                {isPositive ? '+' : '−'}
                {Math.abs(changePercent).toFixed(2)}%
              </span>{' '}
              over {period}
              {last && (
                <>
                  {' '}
                  · 1 {fromCurrency} = {last.rate.toFixed(4)} {toCurrency}
                </>
              )}
            </>
          ) : (
            ' '
          )}
        </p>

        <div role="group" aria-label="Chart period" className="flex gap-4">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={`tabular-nums transition-colors ${
                period === value ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-xl bg-paper-2" />
      ) : isError ? (
        <div className="flex h-56 items-center justify-center t-label text-ink-3">
          Chart unavailable for this pair right now
        </div>
      ) : data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => formatXTick(v, period)}
              tick={axis}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              domain={[minRate, maxRate]}
              tick={axis}
              axisLine={false}
              tickLine={false}
              width={56}
              orientation="right"
              tickFormatter={(v: number) => v.toFixed(3)}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--paper-3)',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'var(--ink-2)', marginBottom: '2px' }}
              itemStyle={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}
              cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
              formatter={(value) => [
                `${toCurrencyData?.symbol ?? ''}${(value as number).toFixed(4)} ${toCurrency}`,
                `1 ${fromCurrency}`,
              ]}
              labelFormatter={(label) =>
                parseLocalDate(label as string).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              }
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="var(--accent)"
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--paper)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-10 t-label text-ink-3">
          No rate history for this pair. The European Central Bank publishes about 30 major
          currencies; live conversion still works.
        </p>
      )}
    </div>
  );
}

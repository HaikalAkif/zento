'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getTimeMachine } from '@/lib/api';
import { getCurrency } from '@/lib/currencies';
import { maxYearsBack, yearsAgo } from '@/lib/dates';
import { formatAmount, formatDate } from '@/lib/format';

interface Props {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
}

const PRESETS = [1, 5, 10, 20];

function money(code: string, value: number): string {
  return `${getCurrency(code)?.symbol ?? ''}${formatAmount(value)} ${code}`;
}

export default function TimeMachine({ fromCurrency, toCurrency, amount }: Props) {
  const maxYears = maxYearsBack();
  const [years, setYears] = useState(10);
  const date = yearsAgo(years);
  const numAmount = parseFloat(amount) || 1;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['time-machine', fromCurrency, toCurrency, date],
    queryFn: () => getTimeMachine(fromCurrency, toCurrency, date),
    // Past rates never change
    staleTime: Infinity,
    retry: false,
    // Hold the last result while dragging through years, instead of flashing a skeleton
    placeholderData: keepPreviousData,
  });

  const thenValue = data ? numAmount * data.then.rate : 0;
  const nowValue = data ? numAmount * data.now.rate : 0;
  const changePct = data ? (data.now.rate / data.then.rate - 1) * 100 : 0;
  const better = changePct >= 0;
  // Bar heights relative to the larger of the two values
  const peak = Math.max(thenValue, nowValue) || 1;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7">
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-50">
            <ClockIcon aria-hidden="true" className="h-4.5 w-4.5 text-violet-400" />
            Money time machine
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            What {numAmount.toLocaleString('en-US')} {fromCurrency} bought in {toCurrency}, then vs
            now
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-400 tabular-nums">
          {years}y ago
        </span>
      </div>

      {/* Year picker */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.filter((p) => p <= maxYears).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setYears(p)}
            aria-pressed={years === p}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              years === p
                ? 'border-violet-500/60 bg-violet-500/15 text-violet-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p} {p === 1 ? 'year' : 'years'}
          </button>
        ))}
      </div>
      <input
        type="range"
        min={1}
        max={maxYears}
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        aria-label="Years back in time"
        aria-valuetext={`${years} years ago, ${formatDate(date)}`}
        className="mb-6 w-full cursor-pointer"
        style={
          { '--p': `${((years - 1) / Math.max(maxYears - 1, 1)) * 100}%` } as React.CSSProperties
        }
      />

      {isError ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
          <ExclamationTriangleIcon className="h-5 w-5 text-slate-600" />
          {error instanceof Error ? error.message : 'Rates unavailable right now.'}
        </div>
      ) : isLoading || !data ? (
        <div className="h-40 animate-pulse rounded-xl bg-slate-800/40" />
      ) : (
        <div className="grid grid-cols-[1fr_auto] items-end gap-6" aria-live="polite">
          <div className="min-w-0 space-y-4">
            <p className="text-sm leading-relaxed text-slate-300">
              On <time dateTime={data.then.date}>{formatDate(data.then.date)}</time>,{' '}
              {money(fromCurrency, numAmount)} bought{' '}
              <strong className="text-slate-50">{money(toCurrency, thenValue)}</strong>. Today it
              buys <strong className="text-slate-50">{money(toCurrency, nowValue)}</strong>.
            </p>
            <p
              className={`text-3xl font-bold tabular-nums sm:text-4xl ${better ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {changePct > 0 ? '+' : ''}
              {changePct.toFixed(1)}%
              <span className="mt-1 block text-xs font-medium text-slate-400">
                {better ? 'more' : 'less'} {toCurrency} for your {fromCurrency} than {years}{' '}
                {years === 1 ? 'year' : 'years'} ago
              </span>
            </p>
          </div>

          {/* Then / now bars */}
          <div className="flex h-32 items-end gap-3" aria-hidden="true">
            {[
              {
                label: String(data.then.date.slice(0, 4)),
                value: thenValue,
                color: 'bg-slate-600',
              },
              { label: 'Now', value: nowValue, color: better ? 'bg-emerald-500' : 'bg-red-500' },
            ].map((bar) => (
              <div
                key={bar.label}
                className="flex h-full flex-col items-center justify-end gap-1.5"
              >
                <div
                  className={`w-10 rounded-t-lg ${bar.color} transition-[height] duration-500 ease-out`}
                  style={{ height: `${Math.max((bar.value / peak) * 100, 4)}%` }}
                />
                <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-[11px] text-slate-500">
        European Central Bank reference rates. Data back to 1999.
      </p>
    </section>
  );
}

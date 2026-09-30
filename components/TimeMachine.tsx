'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
  return `${getCurrency(code)?.symbol ?? ''}${formatAmount(value)}`;
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
    // Hold the last result while scrubbing through years, instead of flashing a skeleton
    placeholderData: keepPreviousData,
  });

  const thenValue = data ? numAmount * data.then.rate : 0;
  const nowValue = data ? numAmount * data.now.rate : 0;
  const changePct = data ? (data.now.rate / data.then.rate - 1) * 100 : 0;
  const better = changePct >= 0;
  const peak = Math.max(thenValue, nowValue) || 1;

  return (
    <div>
      {/* Year picker: presets for the common questions, a scrubber for the rest */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.filter((p) => p <= maxYears).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setYears(p)}
            aria-pressed={years === p}
            className={`rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-colors ${
              years === p
                ? 'border-ink bg-ink text-paper'
                : 'border-line-strong text-ink-2 hover:border-ink-2 hover:text-ink'
            }`}
          >
            {p}y
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-3 tabular-nums">{formatDate(date)}</span>
      </div>
      <input
        type="range"
        min={1}
        max={maxYears}
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        aria-label="Years back in time"
        aria-valuetext={`${years} years ago, ${formatDate(date)}`}
        className="mt-4 w-full"
        style={
          { '--p': `${((years - 1) / Math.max(maxYears - 1, 1)) * 100}%` } as React.CSSProperties
        }
      />

      {isError ? (
        <p className="py-10 text-sm text-ink-2">
          {error instanceof Error ? error.message : 'Rates unavailable right now.'}
        </p>
      ) : isLoading || !data ? (
        <div className="mt-8 h-44 animate-pulse rounded-2xl bg-paper-2" />
      ) : (
        <div className="mt-8" aria-live="polite">
          <p
            className={`text-[clamp(3.5rem,9vw,5.5rem)] t-figure ${better ? 'text-up' : 'text-down'}`}
          >
            {changePct > 0 ? '+' : changePct < 0 ? '−' : ''}
            {Math.abs(changePct).toFixed(1)}%
          </p>
          <p className="mt-2 text-sm text-ink-2">
            {better ? 'more' : 'less'} {toCurrency} for your {fromCurrency} than {years}{' '}
            {years === 1 ? 'year' : 'years'} ago
          </p>

          {/* Then / now as two engraved bars */}
          <dl className="mt-8 space-y-4">
            {[
              {
                label: data.then.date.slice(0, 4),
                value: thenValue,
                date: data.then.date,
                now: false,
              },
              { label: 'Today', value: nowValue, date: data.now.date, now: true },
            ].map((bar) => (
              <div key={bar.label} className="grid grid-cols-[4rem_1fr] items-center gap-4">
                <dt className="t-label text-ink-2">{bar.label}</dt>
                <dd className="min-w-0">
                  <div
                    className={`h-2.5 rounded-full transition-[width] duration-500 ease-out ${
                      bar.now ? (better ? 'bg-up' : 'bg-down') : 'bg-ink-3'
                    }`}
                    style={{ width: `${Math.max((bar.value / peak) * 100, 3)}%` }}
                  />
                  <p className="mt-1.5 text-sm text-ink tabular-nums">
                    {money(fromCurrency, numAmount)} {fromCurrency} ={' '}
                    <strong className="font-semibold">
                      {money(toCurrency, bar.value)} {toCurrency}
                    </strong>
                    <span className="text-ink-3"> · {formatDate(bar.date)}</span>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-ink-3">
            European Central Bank reference rates, back to 1999.
          </p>
        </div>
      )}
    </div>
  );
}

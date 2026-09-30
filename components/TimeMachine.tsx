'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getTimeMachine } from '@/lib/api';
import { maxYearsBack, yearsAgo } from '@/lib/dates';
import { formatAmount, formatDate, formatPlain } from '@/lib/format';

interface Props {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
}

const PRESETS = [1, 5, 10, 20];

/** What the amount bought on the same day years ago, told as a sentence. */
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
    // Hold the last answer while scrubbing through years, instead of flashing a skeleton
    placeholderData: keepPreviousData,
  });

  const changePct = data ? (data.now.rate / data.then.rate - 1) * 100 : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {PRESETS.filter((p) => p <= maxYears).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setYears(p)}
            aria-pressed={years === p}
            className={`text-sm tabular-nums transition-colors ${
              years === p ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
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
        className="mt-5 w-full"
        style={
          { '--p': `${((years - 1) / Math.max(maxYears - 1, 1)) * 100}%` } as React.CSSProperties
        }
      />

      <div className="mt-8 min-h-[4.5rem]" aria-live="polite">
        {isError && !data ? (
          <p className="text-ink-3">
            {error instanceof Error ? error.message : 'Past rates are unavailable right now.'}
          </p>
        ) : isLoading || !data ? (
          <div className="h-16 animate-pulse rounded-lg bg-paper-2" />
        ) : (
          <p className="text-xl leading-snug tracking-tight text-ink-2 tabular-nums sm:text-2xl">
            On {formatDate(data.then.date)}, {formatPlain(numAmount)} {fromCurrency} bought{' '}
            <span className="text-ink">
              {formatAmount(numAmount * data.then.rate)} {toCurrency}
            </span>
            . Today it buys{' '}
            <span className="text-ink">
              {formatAmount(numAmount * data.now.rate)} {toCurrency}
            </span>
            ,{' '}
            <span className={changePct >= 0 ? 'text-up' : 'text-down'}>
              {Math.abs(changePct).toFixed(1)}% {changePct >= 0 ? 'more' : 'less'}
            </span>
            .
          </p>
        )}
      </div>
      <p className="mt-4 t-label text-ink-3">
        European Central Bank reference rates, back to 1999.
      </p>
    </div>
  );
}

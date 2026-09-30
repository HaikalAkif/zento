'use client';

import { useQueries } from '@tanstack/react-query';
import { getMultipleRates } from '@/lib/api';
import { getCurrency } from '@/lib/currencies';
import { ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  /** Pairs to show, already personalised to the visitor's region. */
  pairs: { from: string; to: string }[];
  onSelect: (from: string, to: string) => void;
}

/** One rates request per base currency instead of one per card. */
function groupByBase(pairs: { from: string; to: string }[]): [string, string[]][] {
  const groups: Record<string, string[]> = {};
  for (const { from, to } of pairs) (groups[from] ??= []).push(to);
  return Object.entries(groups);
}

interface CardProps {
  from: string;
  to: string;
  rate: number | undefined;
  isLoading: boolean;
  onSelect: (f: string, t: string) => void;
}

function ConversionCard({ from, to, rate, isLoading, onSelect }: CardProps) {
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);

  return (
    <button
      type="button"
      onClick={() => onSelect(from, to)}
      aria-label={`Convert ${fromCur?.name ?? from} to ${toCur?.name ?? to}`}
      className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 text-left transition-all duration-200 hover:border-slate-600 hover:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
    >
      <div className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xl leading-none select-none">{fromCur?.flag}</span>
          <ArrowRightIcon className="h-3 w-3 text-slate-600" />
          <span className="text-xl leading-none select-none">{toCur?.flag}</span>
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide text-slate-200">
            {from} / {to}
          </div>
          <div className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
            {fromCur?.name}
          </div>
        </div>
      </div>

      <div className="ml-2 shrink-0 text-right">
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="h-3.5 w-16 animate-pulse rounded-full bg-slate-700" />
            <div className="ml-auto h-2.5 w-10 animate-pulse rounded-full bg-slate-700/60" />
          </div>
        ) : rate != null ? (
          <>
            <div className="text-sm font-bold text-slate-100 tabular-nums">{rate.toFixed(4)}</div>
            <div className="mt-0.5 text-[11px] text-slate-400">{toCur?.code}</div>
          </>
        ) : (
          <div className="text-xs text-slate-400">–</div>
        )}
      </div>
    </button>
  );
}

export default function PopularConversions({ pairs, onSelect }: Props) {
  const groupEntries = groupByBase(pairs);
  const results = useQueries({
    queries: groupEntries.map(([from, targets]) => ({
      queryKey: ['pop-rates', from, targets.join(',')],
      queryFn: () => getMultipleRates(from, targets),
      staleTime: 60 * 1000,
      refetchInterval: 60 * 1000,
    })),
  });

  const allFailed = results.every((r) => r.isError);

  const rateMap: Record<string, number | undefined> = {};
  const loadingSet = new Set<string>();
  groupEntries.forEach(([from, targets], i) => {
    if (results[i].isLoading) loadingSet.add(from);
    targets.forEach((to) => {
      rateMap[`${from}-${to}`] = results[i].data?.rates[to];
    });
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7">
      <div className="mb-5">
        <h2 className="text-base font-bold tracking-tight text-slate-50">Popular Pairs</h2>
        <p className="mt-0.5 text-xs text-slate-400">Tap any to switch instantly</p>
      </div>

      {allFailed ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-slate-700" />
          <p className="text-sm text-slate-400">Rates unavailable right now.</p>
          <p className="text-xs text-slate-400">Try refreshing in a moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {pairs.map(({ from, to }) => (
            <ConversionCard
              key={`${from}-${to}`}
              from={from}
              to={to}
              rate={rateMap[`${from}-${to}`]}
              isLoading={loadingSet.has(from)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

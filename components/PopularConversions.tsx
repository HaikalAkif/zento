'use client';

import { useQueries } from '@tanstack/react-query';
import { getMultipleRates } from '@/lib/api';
import { getCurrency, POPULAR_CONVERSIONS } from '@/lib/currencies';
import { ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  onSelect: (from: string, to: string) => void;
}

const FROM_GROUPS = POPULAR_CONVERSIONS.reduce<Record<string, string[]>>((acc, { from, to }) => {
  (acc[from] ??= []).push(to);
  return acc;
}, {});
const GROUP_ENTRIES = Object.entries(FROM_GROUPS);

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
      className="group relative flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 overflow-hidden"
    >
      <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xl leading-none select-none">{fromCur?.flag}</span>
          <ArrowRightIcon className="w-3 h-3 text-slate-600" />
          <span className="text-xl leading-none select-none">{toCur?.flag}</span>
        </div>
        <div>
          <div className="font-bold text-slate-200 text-sm tracking-wide">{from} / {to}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{fromCur?.name}</div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-2">
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="h-3.5 w-16 bg-slate-700 animate-pulse rounded-full" />
            <div className="h-2.5 w-10 bg-slate-700/60 animate-pulse rounded-full ml-auto" />
          </div>
        ) : rate != null ? (
          <>
            <div className="text-sm font-bold text-slate-100 tabular-nums">{rate.toFixed(4)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{toCur?.code}</div>
          </>
        ) : (
          <div className="text-xs text-slate-700">—</div>
        )}
      </div>
    </button>
  );
}

export default function PopularConversions({ onSelect }: Props) {
  const results = useQueries({
    queries: GROUP_ENTRIES.map(([from, targets]) => ({
      queryKey: ['pop-rates', from, targets.join(',')],
      queryFn: () => getMultipleRates(from, targets),
      staleTime: 60 * 1000,
      refetchInterval: 60 * 1000,
    })),
  });

  const allFailed = results.every((r) => r.isError);

  const rateMap: Record<string, number | undefined> = {};
  const loadingSet = new Set<string>();
  GROUP_ENTRIES.forEach(([from, targets], i) => {
    if (results[i].isLoading) loadingSet.add(from);
    targets.forEach((to) => {
      rateMap[`${from}-${to}`] = results[i].data?.rates[to];
    });
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-50 tracking-tight">Popular Pairs</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tap any to switch instantly</p>
      </div>

      {allFailed ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-slate-700" />
          <p className="text-sm text-slate-600">Rates unavailable right now.</p>
          <p className="text-xs text-slate-700">Try refreshing in a moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {POPULAR_CONVERSIONS.map(({ from, to }) => (
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

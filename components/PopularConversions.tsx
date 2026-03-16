'use client';

import { useQuery } from '@tanstack/react-query';
import { getLatestRate } from '@/lib/api';
import { getCurrency, POPULAR_CONVERSIONS } from '@/lib/currencies';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface Props {
  onSelect: (from: string, to: string) => void;
}

function ConversionCard({
  from,
  to,
  onSelect,
}: {
  from: string;
  to: string;
  onSelect: (f: string, t: string) => void;
}) {
  const fromCurrency = getCurrency(from);
  const toCurrency = getCurrency(to);

  const { data, isLoading } = useQuery({
    queryKey: ['rate', from, to],
    queryFn: () => getLatestRate(from, to),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const rate = data?.rates[to];

  return (
    <button
      onClick={() => onSelect(from, to)}
      className="group relative flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 overflow-hidden"
    >
      {/* Hover accent */}
      <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xl leading-none">{fromCurrency?.flag}</span>
          <ArrowRightIcon className="w-3 h-3 text-slate-600" />
          <span className="text-xl leading-none">{toCurrency?.flag}</span>
        </div>
        <div>
          <div className="font-bold text-slate-200 text-sm tracking-wide">
            {from} / {to}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{fromCurrency?.name}</div>
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
            <div className="text-[11px] text-slate-500 mt-0.5">{toCurrency?.code}</div>
          </>
        ) : (
          <div className="text-xs text-slate-600">—</div>
        )}
      </div>
    </button>
  );
}

export default function PopularConversions({ onSelect }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-50 tracking-tight">Popular Pairs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any pair to load it instantly</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {POPULAR_CONVERSIONS.map(({ from, to }) => (
          <ConversionCard key={`${from}-${to}`} from={from} to={to} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

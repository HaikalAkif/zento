'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getMultipleRates } from '@/lib/api';
import { getCurrency, MULTI_CURRENCY_TARGETS } from '@/lib/currencies';
import AnimatedNumber from './AnimatedNumber';

interface Props {
  fromCurrency: string;
  amount: string;
  onSelect: (from: string, to: string) => void;
}

export default function MultiCurrencyResults({ fromCurrency, amount, onSelect }: Props) {
  const targets = MULTI_CURRENCY_TARGETS.filter((t) => t !== fromCurrency);
  const numAmount = parseFloat(amount) || 1;
  const fromCurrencyData = getCurrency(fromCurrency);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['multi-rates', fromCurrency, targets.join(',')],
    queryFn: () => getMultipleRates(fromCurrency, targets),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-50 tracking-tight">
            What {numAmount.toLocaleString()} {fromCurrency} buys today
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {fromCurrencyData?.name} converted to major currencies
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
          Live
        </span>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-slate-700" />
          <p className="text-sm text-slate-400">Rates unavailable right now.</p>
          <p className="text-xs text-slate-400">Try refreshing in a moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {targets.map((target) => {
            const currency = getCurrency(target);
            const rate = data?.rates[target];
            const value = rate != null ? numAmount * rate : null;

            return (
              <button
                key={target}
                type="button"
                onClick={() => onSelect(fromCurrency, target)}
                aria-label={`Convert ${fromCurrency} to ${target}`}
                className="group relative p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2 focus:ring-offset-slate-900 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
                <ArrowUpRightIcon className="absolute top-2.5 right-2.5 w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 group-hover:text-slate-500 transition-all duration-200" />

                {isLoading ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-700 animate-pulse" />
                      <div className="h-3 w-8 bg-slate-700 animate-pulse rounded-full" />
                    </div>
                    <div className="h-5 bg-slate-700 animate-pulse rounded w-20" />
                    <div className="h-2.5 bg-slate-700/60 animate-pulse rounded w-14" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-lg leading-none select-none">{currency?.flag}</span>
                      <span className="text-xs font-bold text-slate-400 tracking-wide">{target}</span>
                    </div>
                    <div className="text-base font-bold text-slate-100 tabular-nums leading-tight">
                      {value != null ? (
                        <AnimatedNumber value={value} decimals={2} duration={350} />
                      ) : (
                        '–'
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate font-medium">
                      {currency?.name}
                    </div>
                    {rate != null && (
                      <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        1 = {rate.toFixed(4)}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

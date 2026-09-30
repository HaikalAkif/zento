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
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-50">
            What {numAmount.toLocaleString()} {fromCurrency} buys today
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {fromCurrencyData?.name} converted to major currencies
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
          Live
        </span>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-slate-700" />
          <p className="text-sm text-slate-400">Rates unavailable right now.</p>
          <p className="text-xs text-slate-400">Try refreshing in a moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 text-left transition-all duration-200 hover:border-slate-600 hover:bg-slate-800 focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
              >
                <div className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <ArrowUpRightIcon className="absolute top-2.5 right-2.5 h-3 w-3 text-slate-700 opacity-0 transition-all duration-200 group-hover:text-slate-500 group-hover:opacity-100" />

                {isLoading ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 animate-pulse rounded-full bg-slate-700" />
                      <div className="h-3 w-8 animate-pulse rounded-full bg-slate-700" />
                    </div>
                    <div className="h-5 w-20 animate-pulse rounded bg-slate-700" />
                    <div className="h-2.5 w-14 animate-pulse rounded bg-slate-700/60" />
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="text-lg leading-none select-none">{currency?.flag}</span>
                      <span className="text-xs font-bold tracking-wide text-slate-400">
                        {target}
                      </span>
                    </div>
                    <div className="text-base leading-tight font-bold text-slate-100 tabular-nums">
                      {value != null ? (
                        <AnimatedNumber value={value} decimals={2} duration={350} />
                      ) : (
                        '–'
                      )}
                    </div>
                    <div className="mt-1 truncate text-[11px] font-medium text-slate-400">
                      {currency?.name}
                    </div>
                    {rate != null && (
                      <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
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

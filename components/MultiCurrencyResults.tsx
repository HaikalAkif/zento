'use client';

import { useQuery } from '@tanstack/react-query';
import { getMultipleRates } from '@/lib/api';
import { getCurrency, MULTI_CURRENCY_TARGETS } from '@/lib/currencies';
import AnimatedNumber from './AnimatedNumber';

interface Props {
  fromCurrency: string;
  amount: string;
}

export default function MultiCurrencyResults({ fromCurrency, amount }: Props) {
  const targets = MULTI_CURRENCY_TARGETS.filter((t) => t !== fromCurrency);
  const numAmount = parseFloat(amount) || 1;
  const fromCurrencyData = getCurrency(fromCurrency);

  const { data, isLoading } = useQuery({
    queryKey: ['multi-rates', fromCurrency, targets.join(',')],
    queryFn: () => getMultipleRates(fromCurrency, targets),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-50 tracking-tight">
            {numAmount.toLocaleString()} {fromCurrency} converted
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {fromCurrencyData?.name} → major world currencies
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {targets.map((target) => {
          const currency = getCurrency(target);
          const rate = data?.rates[target];
          const value = rate != null ? numAmount * rate : null;

          return (
            <div
              key={target}
              className="group relative p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all duration-200 overflow-hidden"
            >
              {/* Left accent on hover */}
              <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />

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
                      '—'
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 truncate font-medium">
                    {currency?.name}
                  </div>
                  {rate != null && (
                    <div className="text-[11px] text-slate-600 mt-0.5 tabular-nums">
                      1 = {rate.toFixed(4)}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

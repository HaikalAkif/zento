'use client';

import { useQuery } from '@tanstack/react-query';
import { getMultipleRates } from '@/lib/api';
import { getCurrency } from '@/lib/currencies';
import { formatRate } from '@/lib/format';
import AnimatedNumber from './AnimatedNumber';
import CurrencyMark from './CurrencyMark';

interface Props {
  fromCurrency: string;
  amount: string;
  /** Currencies to convert into, visitor's own first. */
  targets: string[];
  onSelect: (from: string, to: string) => void;
}

/** A ruled ledger rather than a grid of boxes: one line per currency. */
export default function MultiCurrencyResults({
  fromCurrency,
  amount,
  targets: allTargets,
  onSelect,
}: Props) {
  const targets = allTargets.filter((t) => t !== fromCurrency);
  const numAmount = parseFloat(amount) || 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['multi-rates', fromCurrency, targets.join(',')],
    queryFn: () => getMultipleRates(fromCurrency, targets),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  if (isError) {
    return (
      <p className="text-sm text-ink-2">Rates unavailable right now. Try again in a moment.</p>
    );
  }

  return (
    <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
      {targets.map((target) => {
        const currency = getCurrency(target);
        const rate = data?.rates[target];
        return (
          <li key={target} className="border-b border-line">
            <button
              type="button"
              onClick={() => onSelect(fromCurrency, target)}
              aria-label={`Convert ${fromCurrency} to ${currency?.name ?? target}`}
              className="group flex w-full items-center gap-3 py-3.5 text-left"
            >
              <CurrencyMark code={target} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink transition-colors group-hover:text-accent">
                  {target}
                </span>
                <span className="block truncate text-xs text-ink-3">{currency?.name}</span>
              </span>
              <span className="text-right">
                {isLoading || rate == null ? (
                  <span className="inline-block h-6 w-20 animate-pulse rounded bg-paper-2" />
                ) : (
                  <>
                    <AnimatedNumber
                      value={numAmount * rate}
                      decimals={2}
                      duration={350}
                      className="block text-lg font-medium tracking-tight text-ink tabular-nums"
                    />
                    <span className="mt-0.5 block text-xs text-ink-3 tabular-nums">
                      1 = {formatRate(rate)}
                    </span>
                  </>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { getMultipleRates } from '@/lib/api';
import { getCurrency } from '@/lib/currencies';
import { formatAmount } from '@/lib/format';

interface Props {
  fromCurrency: string;
  amount: string;
  /** Currencies to convert into, visitor's own first. */
  targets: string[];
  onSelect: (from: string, to: string) => void;
}

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

  if (isError && !data) {
    return <p className="t-label text-ink-3">Rates are unavailable right now.</p>;
  }

  return (
    <ul className="-mx-3">
      {targets.map((target) => {
        const rate = data?.rates[target];
        return (
          <li key={target}>
            <button
              type="button"
              onClick={() => onSelect(fromCurrency, target)}
              aria-label={`Convert ${fromCurrency} to ${getCurrency(target)?.name ?? target}`}
              className="group flex w-full items-baseline gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-paper-2"
            >
              <span className="w-10 shrink-0 text-[15px] font-medium text-ink">{target}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-3">
                {getCurrency(target)?.name}
              </span>
              {isLoading ? (
                <span className="h-4 w-20 animate-pulse self-center rounded bg-paper-2" />
              ) : rate == null ? (
                // Loaded, but the provider has no rate for this one
                <span className="text-sm text-ink-3">no rate</span>
              ) : (
                <span className="text-[15px] text-ink tabular-nums transition-colors group-hover:text-accent">
                  {formatAmount(numAmount * rate)}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

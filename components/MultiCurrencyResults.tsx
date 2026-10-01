'use client';

import { useQuery } from '@tanstack/react-query';
import { getMultipleRates } from '@/lib/api';
import { formatAmount } from '@/lib/format';
import { currencyName } from '@/lib/i18n';
import { pairHref } from '@/lib/paths';
import { useLang } from './LangProvider';

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
  const { lang, t } = useLang();
  const targets = allTargets.filter((code) => code !== fromCurrency);
  const numAmount = parseFloat(amount) || 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['multi-rates', fromCurrency, targets.join(',')],
    queryFn: () => getMultipleRates(fromCurrency, targets),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  if (isError && !data) {
    return <p className="t-label text-ink-3">{t.compare.unavailable}</p>;
  }

  return (
    <ul className="-mx-3">
      {targets.map((target) => {
        const rate = data?.rates[target];
        return (
          <li key={target}>
            {/* A real link, so crawlers can follow it to the pair page; a plain click
                switches the converter in place instead */}
            <a
              href={pairHref(fromCurrency, target, amount, lang)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                onSelect(fromCurrency, target);
              }}
              aria-label={t.compare.convert(fromCurrency, currencyName(target, lang))}
              className="group flex w-full items-baseline gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-paper-2"
            >
              <span className="w-10 shrink-0 text-[15px] font-medium text-ink">{target}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-3">
                {currencyName(target, lang)}
              </span>
              {isLoading ? (
                <span className="h-4 w-20 animate-pulse self-center rounded bg-paper-2" />
              ) : rate == null ? (
                // Loaded, but the provider has no rate for this one
                <span className="text-sm text-ink-3">{t.compare.noRate}</span>
              ) : (
                <span className="text-[15px] text-ink tabular-nums transition-colors group-hover:text-accent">
                  {formatAmount(numAmount * rate)}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

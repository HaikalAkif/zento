'use client';

import { useQueries } from '@tanstack/react-query';
import { getMultipleRates } from '@/lib/api';
import { getCurrency } from '@/lib/currencies';
import { formatRate } from '@/lib/format';

interface Props {
  /** Pairs to show, already personalised to the visitor's region */
  pairs: { from: string; to: string }[];
  onSelect: (from: string, to: string) => void;
}

/** One rates request per base currency instead of one per pair. */
function groupByBase(pairs: { from: string; to: string }[]): [string, string[]][] {
  const groups: Record<string, string[]> = {};
  for (const { from, to } of pairs) (groups[from] ??= []).push(to);
  return Object.entries(groups);
}

/**
 * A ticker tape of popular pairs. The list is rendered twice and slid left by one
 * copy's width, so it loops seamlessly. The second copy is hidden from assistive
 * tech and the tab order. Hover or focus pauses it; reduced motion makes it a plain
 * scrollable row.
 */
export default function RateTape({ pairs, onSelect }: Props) {
  const groups = groupByBase(pairs);
  const results = useQueries({
    queries: groups.map(([from, targets]) => ({
      queryKey: ['pop-rates', from, targets.join(',')],
      queryFn: () => getMultipleRates(from, targets),
      staleTime: 60 * 1000,
      refetchInterval: 60 * 1000,
    })),
  });

  const rates: Record<string, number | undefined> = {};
  groups.forEach(([from, targets], i) => {
    for (const to of targets) rates[`${from}-${to}`] = results[i].data?.rates[to];
  });

  const items = (copy: 0 | 1) =>
    pairs.map(({ from, to }) => {
      const rate = rates[`${from}-${to}`];
      return (
        <li key={`${copy}-${from}-${to}`} className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect(from, to)}
            tabIndex={copy === 1 ? -1 : undefined}
            aria-label={`Convert ${getCurrency(from)?.name ?? from} to ${getCurrency(to)?.name ?? to}`}
            className="group flex items-baseline gap-2 px-5 py-3 text-sm whitespace-nowrap"
          >
            <span className="font-semibold text-ink transition-colors group-hover:text-accent">
              {from}
              <span className="text-ink-3">/</span>
              {to}
            </span>
            <span className="text-ink-2 tabular-nums">
              {rate != null ? formatRate(rate) : '·····'}
            </span>
          </button>
        </li>
      );
    });

  return (
    <div className="group/tape relative overflow-hidden border-y border-line bg-paper-2/60">
      <p className="sr-only">Popular currency pairs</p>
      {/* Edge fades so items slide in and out rather than getting chopped */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-paper to-transparent" />
      <div className="[scrollbar-width:none] overflow-x-auto motion-safe:overflow-hidden [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max motion-safe:animate-[tape_45s_linear_infinite] motion-safe:group-focus-within/tape:[animation-play-state:paused] motion-safe:group-hover/tape:[animation-play-state:paused]">
          <ul className="flex divide-x divide-line border-r border-line">{items(0)}</ul>
          <ul className="flex divide-x divide-line motion-reduce:hidden" aria-hidden="true">
            {items(1)}
          </ul>
        </div>
      </div>
    </div>
  );
}

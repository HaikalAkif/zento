'use client';

import type { HistoryItem } from '@/hooks/useConversionHistory';

interface Props {
  items: HistoryItem[];
  onSelect: (from: string, to: string) => void;
}

export default function RecentPairs({ items, onSelect }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6 flex items-center gap-3">
      <p className="shrink-0 t-label text-ink-3">Recent</p>
      <ul className="flex min-w-0 [scrollbar-width:none] gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
        {items.map(({ from, to }) => (
          <li key={`${from}-${to}`} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(from, to)}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-2 tabular-nums transition-colors hover:bg-paper-2 hover:text-ink"
            >
              {from}
              <span className="px-0.5 text-ink-3">/</span>
              {to}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

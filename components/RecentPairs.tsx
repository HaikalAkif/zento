'use client';

import { getCurrency } from '@/lib/currencies';
import type { HistoryItem } from '@/hooks/useConversionHistory';

interface Props {
  items: HistoryItem[];
  onSelect: (from: string, to: string) => void;
}

export default function RecentPairs({ items, onSelect }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-3 px-0.5 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
        Recently used
      </p>
      <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
        {items.map(({ from, to }) => {
          const f = getCurrency(from);
          const t = getCurrency(to);
          return (
            <button
              key={`${from}-${to}`}
              type="button"
              onClick={() => onSelect(from, to)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-700/40 bg-slate-800/50 py-1.5 pr-3.5 pl-2.5 text-xs font-semibold text-slate-400 transition-all duration-200 hover:border-slate-600/70 hover:bg-slate-700/70 hover:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
            >
              <span className="text-sm leading-none select-none">{f?.flag}</span>
              <span className="text-slate-300">{from}</span>
              <span className="h-1 w-1 shrink-0 rounded-full bg-slate-700" />
              <span className="text-sm leading-none select-none">{t?.flag}</span>
              <span className="text-slate-300">{to}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

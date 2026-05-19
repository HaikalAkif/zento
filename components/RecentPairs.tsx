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
      <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3 px-0.5">
        Recently used
      </p>
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] pb-0.5">
        {items.map(({ from, to }) => {
          const f = getCurrency(from);
          const t = getCurrency(to);
          return (
            <button
              key={`${from}-${to}`}
              type="button"
              onClick={() => onSelect(from, to)}
              className="shrink-0 flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700/40 hover:border-slate-600/70 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <span className="text-sm leading-none select-none">{f?.flag}</span>
              <span className="text-slate-300">{from}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
              <span className="text-sm leading-none select-none">{t?.flag}</span>
              <span className="text-slate-300">{to}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

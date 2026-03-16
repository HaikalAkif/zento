'use client';

const AMOUNTS = [10, 50, 100, 500, 1000];

interface Props {
  current: string;
  onSelect: (amount: string) => void;
}

export default function QuickAmounts({ current, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest shrink-0">
        Quick
      </span>
      <div className="w-px h-3.5 bg-slate-800" />
      {AMOUNTS.map((amount) => {
        const active = current === String(amount);
        return (
          <button
            key={amount}
            onClick={() => onSelect(String(amount))}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
              active
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/80 hover:border-blue-600/60 hover:text-blue-400 hover:bg-slate-800'
            }`}
          >
            {amount.toLocaleString()}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { ArrowsRightLeftIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { getCurrency } from '@/lib/currencies';
import CurrencySelect from './CurrencySelect';
import AnimatedNumber from './AnimatedNumber';

const QUICK_AMOUNTS = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const SLIDER_MIN = QUICK_AMOUNTS[0];
const SLIDER_MAX = QUICK_AMOUNTS[QUICK_AMOUNTS.length - 1];

interface Props {
  amount: string;
  fromCurrency: string;
  toCurrency: string;
  onAmountChange: (v: string) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onSwap: () => void;
}

export default function CurrencyConverter({
  amount,
  fromCurrency,
  toCurrency,
  onAmountChange,
  onFromChange,
  onToChange,
  onSwap,
}: Props) {
  const [copied, setCopied] = useState(false);
  const { data, isLoading, isError } = useCurrencyRate(fromCurrency, toCurrency);

  const rate = data?.rates[toCurrency] ?? 0;
  const numAmount = parseFloat(amount) || 0;
  const result = numAmount * rate;
  const toCurrencyData = getCurrency(toCurrency);
  const fromCurrencyData = getCurrency(fromCurrency);
  const isSame = fromCurrency === toCurrency;

  // Clamp slider to its range; outside values are still valid in the text input
  const sliderValue = Math.min(Math.max(numAmount, SLIDER_MIN), SLIDER_MAX);
  const sliderPercent = ((sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.toFixed(2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [result]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  }, []);

  return (
    <div className="w-full text-center">

      {/* ── Currency selector row ── */}
      <div className="flex items-center justify-center gap-3 mb-6 sm:mb-10">
        <div className="flex-1 min-w-0">
          <CurrencySelect value={fromCurrency} onChange={onFromChange} />
        </div>

        <button
          onClick={onSwap}
          title="Swap currencies (Alt+S)"
          aria-label="Swap currencies"
          className="shrink-0 w-11 h-11 rounded-full border border-slate-700 bg-slate-800/60 hover:bg-blue-600 hover:border-blue-600 text-slate-400 hover:text-white hover:rotate-180 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <ArrowsRightLeftIcon className="w-4.5 h-4.5" />
        </button>

        <div className="flex-1 min-w-0">
          <CurrencySelect value={toCurrency} onChange={onToChange} align="right" />
        </div>
      </div>

      {/* ── FROM amount ── */}
      <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
        From
      </p>
      <div className="flex items-baseline justify-center gap-1.5 mb-4 sm:mb-7">
        <span className="text-3xl sm:text-4xl font-bold text-slate-600 leading-none select-none">
          {fromCurrencyData?.symbol}
        </span>
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          min="0"
          inputMode="decimal"
          className="bg-transparent border-none outline-none text-5xl sm:text-7xl font-bold text-slate-50 tracking-tight placeholder:text-slate-800 [appearance:textfield] text-center"
          style={{ width: `${Math.max((amount || '0').length, 1) + 1}ch` }}
        />
      </div>

      {/* ── Slider ── */}
      <div className="mb-2 px-1">
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          value={sliderValue}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-full cursor-pointer"
          style={{ '--p': `${sliderPercent}%` } as React.CSSProperties}
        />
        <div className="flex justify-between mt-2">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => onAmountChange(String(a))}
              className={`text-[11px] font-semibold transition-colors ${
                numAmount === a ? 'text-blue-400' : 'text-slate-700 hover:text-slate-400'
              }`}
            >
              {a.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rate badge ── */}
      <div className="flex items-center justify-center h-10 mb-6">
        {data && !isSame && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
            Rate: {rate.toFixed(4)} {toCurrency}/{fromCurrency}
          </div>
        )}
      </div>

      {/* ── TO amount ── */}
      <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
        To
      </p>
      <div
        className="flex items-baseline justify-center gap-1.5 mb-5 sm:mb-8"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-3xl sm:text-4xl font-bold text-slate-600 leading-none select-none">
          {toCurrencyData?.symbol}
        </span>
        {isSame ? (
          <span className="text-5xl sm:text-7xl font-bold text-slate-800">—</span>
        ) : isLoading ? (
          <div className="h-14 sm:h-20 w-48 bg-slate-800/60 animate-pulse rounded-xl" />
        ) : isError ? (
          <span className="text-lg text-red-400 font-medium">Failed to fetch rate</span>
        ) : (
          <AnimatedNumber
            value={result}
            decimals={2}
            duration={400}
            className="text-5xl sm:text-7xl font-bold text-slate-50 tracking-tight tabular-nums"
          />
        )}
      </div>

      {/* ── Copy button ── */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        aria-label="Copy result"
      >
        {copied ? (
          <>
            <CheckIcon className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <ClipboardDocumentIcon className="w-4 h-4" />
            Copy Result
          </>
        )}
      </button>

      {/* ── Updated date ── */}
      {data && !isSame && (
        <p className="text-[11px] text-slate-700 mt-4">
          Updated{' '}
          {new Date(data.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}

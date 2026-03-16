'use client';

import { useState, useCallback } from 'react';
import { ArrowsRightLeftIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { getCurrency } from '@/lib/currencies';
import CurrencySelect from './CurrencySelect';
import AnimatedNumber from './AnimatedNumber';

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
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Subtle top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="p-5 sm:p-9">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-50 tracking-tight">
              Currency Converter
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Live mid-market rates
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-6">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              min="0"
              inputMode="decimal"
              className="w-full px-5 py-4 text-3xl font-bold text-slate-50 bg-slate-800/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-700 tracking-tight"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
              {fromCurrencyData?.code}
            </div>
          </div>
        </div>

        {/* Currency selector row */}
        <div className="flex items-end gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <CurrencySelect value={fromCurrency} onChange={onFromChange} label="From" />
          </div>

          {/* Floating swap button */}
          <button
            onClick={onSwap}
            title="Swap currencies (Alt+S)"
            aria-label="Swap currencies"
            className="shrink-0 mb-0.5 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-500/40 hover:rotate-180 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <ArrowsRightLeftIcon className="w-4.5 h-4.5" />
          </button>

          <div className="flex-1 min-w-0">
            <CurrencySelect value={toCurrency} onChange={onToChange} label="To" align="right" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-6" />

        {/* Result panel — aria-live announces value changes to screen readers */}
        <div className="min-h-32" aria-live="polite" aria-atomic="true">
          {isSame ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
              Select two different currencies
            </div>
          ) : isLoading ? (
            <div className="animate-pulse space-y-3 pt-2">
              <div className="h-3.5 bg-slate-800 rounded-full w-28" />
              <div className="h-14 bg-slate-800 rounded-xl w-64" />
              <div className="h-3 bg-slate-800 rounded-full w-40" />
              <div className="h-3 bg-slate-800/60 rounded-full w-52 mt-4" />
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Failed to fetch rate — please try again
            </div>
          ) : (
            <div>
              {/* From label */}
              <p className="text-xs text-slate-500 font-medium mb-2">
                {fromCurrencyData?.flag} {amount || '0'} {fromCurrencyData?.name} equals
              </p>

              {/* Big result */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-bold text-slate-50 tracking-tighter leading-none tabular-nums">
                      <AnimatedNumber value={result} decimals={2} duration={400} />
                    </span>
                    <span className="text-xl font-bold text-blue-400">{toCurrency}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    {toCurrencyData?.flag} {toCurrencyData?.name}
                  </p>
                </div>

                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 hover:border-slate-600 transition-all text-xs font-semibold mt-1"
                  aria-label="Copy result"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Rate footer */}
              {data && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-3 border-t border-slate-800 flex-wrap gap-1">
                  <span className="font-medium">
                    1 {fromCurrency} = <span className="text-slate-400">{rate.toFixed(6)}</span>{' '}
                    {toCurrency}
                  </span>
                  <span>
                    Updated{' '}
                    {new Date(data.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

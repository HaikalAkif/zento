'use client';

import { useState, useCallback } from 'react';
import {
  ArrowsRightLeftIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { useRateChange } from '@/hooks/useRateChange';
import { getCurrency } from '@/lib/currencies';
import CurrencySelect from './CurrencySelect';
import AnimatedNumber from './AnimatedNumber';

const QUICK_AMOUNTS = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const SLIDER_MIN = QUICK_AMOUNTS[0];
const SLIDER_MAX = QUICK_AMOUNTS[QUICK_AMOUNTS.length - 1];
const SLIDER_STEPS = 1000;

// Log-scale helpers. QUICK_AMOUNTS span 3 orders of magnitude, so a linear
// slider puts most resolution near zero and makes labels wildly misaligned.
const LOG_MIN = Math.log(SLIDER_MIN);
const LOG_MAX = Math.log(SLIDER_MAX);

function valueToPosition(val: number): number {
  if (!isFinite(val) || val <= 0) return 0;
  const clamped = Math.min(Math.max(val, SLIDER_MIN), SLIDER_MAX);
  return Math.round(((Math.log(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * SLIDER_STEPS);
}

function positionToValue(pos: number): number {
  return Math.round(Math.exp(LOG_MIN + (pos / SLIDER_STEPS) * (LOG_MAX - LOG_MIN)));
}

function fmtLabel(a: number): string {
  return a >= 1000 ? `${a / 1000}k` : String(a);
}

// Pre-computed so JSX doesn't recalculate on every render
const LABEL_POSITIONS = QUICK_AMOUNTS.map((a, idx) => ({
  value: a,
  pct: (valueToPosition(a) / SLIDER_STEPS) * 100,
  label: fmtLabel(a),
  isFirst: idx === 0,
  isLast: idx === QUICK_AMOUNTS.length - 1,
}));

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
  const [shared, setShared] = useState(false);

  const { data, isLoading, isError } = useCurrencyRate(fromCurrency, toCurrency);
  const { data: change } = useRateChange(fromCurrency, toCurrency);

  const rate = data?.rates[toCurrency] ?? 0;
  const numAmount = parseFloat(amount) || 0;
  const result = numAmount * rate;
  const toCurrencyData = getCurrency(toCurrency);
  const fromCurrencyData = getCurrency(fromCurrency);
  const isSame = fromCurrency === toCurrency;

  const sliderPos = valueToPosition(numAmount);
  const sliderPercent = (sliderPos / SLIDER_STEPS) * 100;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.toFixed(2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [result]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      setShared(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  }, []);

  return (
    <div className="w-full text-center">

      {/* ── Currency pair selector ── */}
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
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
        From
      </p>
      <div className="flex items-baseline justify-center gap-1.5 mb-4 sm:mb-7">
        <span className="text-3xl sm:text-4xl font-bold text-slate-500 leading-none select-none">
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
          aria-label={`Amount in ${fromCurrencyData?.name ?? fromCurrency}`}
          className="bg-transparent border-none outline-none text-5xl sm:text-7xl font-bold text-slate-50 tracking-tight placeholder:text-slate-800 [appearance:textfield] text-center"
          style={{ width: `${Math.max((amount || '0').length, 1) + 1}ch` }}
        />
      </div>

      {/* ── Slider (log scale) ── */}
      <div className="mb-2 px-1">
        <input
          type="range"
          min={0}
          max={SLIDER_STEPS}
          value={sliderPos}
          onChange={(e) => onAmountChange(String(positionToValue(Number(e.target.value))))}
          aria-label="Amount slider"
          aria-valuetext={`${numAmount} ${fromCurrency}`}
          className="w-full cursor-pointer"
          style={{ '--p': `${sliderPercent}%` } as React.CSSProperties}
        />
        {/* Labels are absolutely positioned to match log-scale thumb positions */}
        <div className="relative mt-2 h-4">
          {LABEL_POSITIONS.map(({ value: a, pct, label, isFirst, isLast }) => (
            <button
              key={a}
              type="button"
              onClick={() => onAmountChange(String(a))}
              aria-label={`Set amount to ${a.toLocaleString()} ${fromCurrency}`}
              style={{ left: `${pct}%` }}
              className={`absolute text-[11px] font-semibold transition-colors whitespace-nowrap ${
                isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'
              } ${numAmount === a ? 'text-blue-400' : 'text-slate-400 hover:text-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rate + 24h change badge ── */}
      <div className="flex items-center justify-center min-h-10 mb-6">
        {data && !isSame && (
          <div className="inline-flex items-center rounded-full border border-slate-700/60 overflow-hidden text-xs font-semibold">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</span>
              <span className="text-slate-100 tabular-nums">{rate.toFixed(4)}</span>
              <span className="text-slate-400 font-normal">{toCurrency}/{fromCurrency}</span>
            </div>
            {change && change.direction !== 'flat' && (
              <>
                <div className="w-px h-4 bg-slate-700/80 shrink-0" />
                <div
                  className={`flex items-center gap-1 px-3 py-1.5 tabular-nums ${
                    change.direction === 'up'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-red-400 bg-red-500/10'
                  }`}
                >
                  <span>{change.direction === 'up' ? '↑' : '↓'}</span>
                  <span>{change.percent > 0 ? '+' : ''}{change.percent.toFixed(2)}%</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── TO amount ── */}
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
        To
      </p>
      <div
        className="flex items-baseline justify-center gap-1.5 mb-5 sm:mb-8"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-3xl sm:text-4xl font-bold text-slate-500 leading-none select-none">
          {toCurrencyData?.symbol}
        </span>
        {isSame ? (
          <span className="text-5xl sm:text-7xl font-bold text-slate-800">–</span>
        ) : isLoading ? (
          <div className="h-14 sm:h-20 w-48 bg-slate-800/60 animate-pulse rounded-xl" />
        ) : isError ? (
          <span className="text-base text-red-400/80 font-medium">Rate unavailable right now</span>
        ) : (
          <AnimatedNumber
            value={result}
            decimals={2}
            duration={400}
            className="text-5xl sm:text-7xl font-bold text-slate-50 tracking-tight tabular-nums"
          />
        )}
      </div>

      {/* ── Actions: unified copy / share pill ── */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-xl overflow-hidden border border-slate-700/80 shadow-lg shadow-black/20">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              copied
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            aria-label="Copy converted amount"
          >
            {copied
              ? <CheckIcon className="w-3.5 h-3.5 shrink-0" />
              : <ClipboardDocumentIcon className="w-3.5 h-3.5 shrink-0" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <div className="w-px bg-slate-700/80 shrink-0" />
          <button
            type="button"
            onClick={handleShare}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              shared
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            aria-label="Copy link to this page"
          >
            {shared
              ? <CheckIcon className="w-3.5 h-3.5 shrink-0" />
              : <ArrowUpRightIcon className="w-3.5 h-3.5 shrink-0" />}
            {shared ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* ── Last updated ── */}
      {data && !isSame && (
        <p className="text-[11px] text-slate-400">
          Rates as of{' '}
          {(() => {
            const [y, m, d] = data.date.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          })()}
        </p>
      )}
    </div>
  );
}

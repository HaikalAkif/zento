'use client';

import { useState, useCallback } from 'react';
import {
  ArrowsRightLeftIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowUpRightIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { useRateChange } from '@/hooks/useRateChange';
import { getCurrency } from '@/lib/currencies';
import type { RateResponse } from '@/lib/api';
import CurrencySelect from './CurrencySelect';
import AnimatedNumber from './AnimatedNumber';
import RateAlert from './RateAlert';

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
  /** Server-fetched rates, so the result renders without waiting for the client fetch. */
  seedRates?: RateResponse;
}

export default function CurrencyConverter({
  amount,
  fromCurrency,
  toCurrency,
  onAmountChange,
  onFromChange,
  onToChange,
  onSwap,
  seedRates,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  const { data, isLoading, isError } = useCurrencyRate(fromCurrency, toCurrency, seedRates);
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
      <div className="mb-6 flex items-center justify-center gap-3 sm:mb-10">
        <div className="min-w-0 flex-1">
          <CurrencySelect value={fromCurrency} onChange={onFromChange} />
        </div>

        <button
          onClick={onSwap}
          title="Swap currencies (Alt+S)"
          aria-label="Swap currencies"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 transition-all duration-300 hover:rotate-180 hover:border-blue-600 hover:bg-blue-600 hover:text-white focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
        >
          <ArrowsRightLeftIcon className="h-4.5 w-4.5" />
        </button>

        <div className="min-w-0 flex-1">
          <CurrencySelect value={toCurrency} onChange={onToChange} align="right" />
        </div>
      </div>

      {/* ── FROM amount ── */}
      <p className="mb-3 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
        From
      </p>
      <div className="mb-4 flex items-baseline justify-center gap-1.5 sm:mb-7">
        <span className="text-3xl leading-none font-bold text-slate-500 select-none sm:text-4xl">
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
          className="[appearance:textfield] border-none bg-transparent text-center text-5xl font-bold tracking-tight text-slate-50 outline-none placeholder:text-slate-800 sm:text-7xl"
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
              className={`absolute text-[11px] font-semibold whitespace-nowrap transition-colors ${
                isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'
              } ${numAmount === a ? 'text-blue-400' : 'text-slate-400 hover:text-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rate + 24h change badge ── */}
      <div className="mb-6 flex min-h-10 items-center justify-center">
        {data && !isSame && (
          <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-700/60 text-xs font-semibold">
            <div className="flex items-center gap-2 bg-slate-800/70 px-4 py-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Rate
              </span>
              <span className="text-slate-100 tabular-nums">{rate.toFixed(4)}</span>
              <span className="font-normal text-slate-400">
                {toCurrency}/{fromCurrency}
              </span>
            </div>
            {change && change.direction !== 'flat' && (
              <>
                <div className="h-4 w-px shrink-0 bg-slate-700/80" />
                <div
                  className={`flex items-center gap-1 px-3 py-1.5 tabular-nums ${
                    change.direction === 'up'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  <span>{change.direction === 'up' ? '↑' : '↓'}</span>
                  <span>
                    {change.percent > 0 ? '+' : ''}
                    {change.percent.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── TO amount ── */}
      <p className="mb-3 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">To</p>
      <div
        className="mb-5 flex items-baseline justify-center gap-1.5 sm:mb-8"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-3xl leading-none font-bold text-slate-500 select-none sm:text-4xl">
          {toCurrencyData?.symbol}
        </span>
        {isSame ? (
          <span className="text-5xl font-bold text-slate-800 sm:text-7xl">–</span>
        ) : isLoading ? (
          <div className="h-14 w-48 animate-pulse rounded-xl bg-slate-800/60 sm:h-20" />
        ) : isError ? (
          <span className="text-base font-medium text-red-400/80">Rate unavailable right now</span>
        ) : (
          <AnimatedNumber
            value={result}
            decimals={2}
            duration={400}
            className="text-5xl font-bold tracking-tight text-slate-50 tabular-nums sm:text-7xl"
          />
        )}
      </div>

      {/* ── Actions: unified copy / share pill ── */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex overflow-hidden rounded-xl border border-slate-700/80 shadow-lg shadow-black/20">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              copied
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            aria-label="Copy converted amount"
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <div className="w-px shrink-0 bg-slate-700/80" />
          <button
            type="button"
            onClick={handleShare}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              shared
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            aria-label="Copy link to this page"
          >
            {shared ? (
              <CheckIcon className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            {shared ? 'Copied!' : 'Share'}
          </button>
          <div className="w-px shrink-0 bg-slate-700/80" />
          <button
            type="button"
            onClick={() => setAlertOpen((o) => !o)}
            disabled={isSame || !rate}
            aria-expanded={alertOpen}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${
              alertOpen
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            aria-label="Set a rate alert for this pair"
          >
            <BellIcon className="h-3.5 w-3.5 shrink-0" />
            Alert
          </button>
        </div>
      </div>

      {alertOpen && !isSame && rate > 0 && (
        // Keyed on the pair so switching currencies resets the suggested threshold
        <RateAlert
          key={`${fromCurrency}-${toCurrency}`}
          base={fromCurrency}
          target={toCurrency}
          rate={rate}
        />
      )}

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

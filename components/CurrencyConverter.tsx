'use client';

import { useState, useCallback } from 'react';
import {
  ArrowsUpDownIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  LinkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { useRateChange } from '@/hooks/useRateChange';
import { getCurrency } from '@/lib/currencies';
import type { RateResponse } from '@/lib/api';
import { formatDate, formatRate } from '@/lib/format';
import CurrencySelect from './CurrencySelect';
import AnimatedNumber from './AnimatedNumber';
import RateAlert from './RateAlert';

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

const CHIPS = [10, 50, 100, 500, 1000, 5000];

/** Quick amounts that make sense for the source currency: nobody converts ¥10. */
function chipsFor(rate: number): number[] {
  const scale = rate > 0 && rate < 0.1 ? 10 ** Math.round(-Math.log10(rate)) : 1;
  return CHIPS.map((c) => c * scale);
}

function compact(n: number): string {
  if (n >= 1e6) return `${n / 1e6}M`;
  if (n >= 1e3) return `${n / 1e3}k`;
  return String(n);
}

/** Big figures shrink as they get longer, so 30,000,000 IDR still fits a phone. */
function figureSize(text: string): React.CSSProperties {
  const len = Math.max(text.length, 4);
  return { fontSize: `clamp(2.25rem, ${Math.min(15, 96 / len)}vw, ${Math.min(6.5, 44 / len)}rem)` };
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
  const from = getCurrency(fromCurrency);
  const to = getCurrency(toCurrency);
  const isSame = fromCurrency === toCurrency;
  const resultText = result.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.toFixed(2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [result]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      // The native share sheet on phones, the clipboard everywhere else
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: `${fromCurrency} to ${toCurrency} on Zento`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }, [fromCurrency, toCurrency]);

  const action =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-40';

  return (
    <div className="w-full">
      {/* ── From ── */}
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-start gap-1.5">
          <span className="sr-only">Amount in {from?.name ?? fromCurrency}</span>
          <span
            aria-hidden="true"
            className="shrink-0 self-start pt-[0.3em] text-2xl leading-none font-light text-ink-3 select-none sm:text-3xl"
          >
            {from?.symbol}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="0"
            min="0"
            inputMode="decimal"
            className="w-full min-w-0 bg-transparent t-figure text-ink outline-none placeholder:text-ink-3"
            style={figureSize(amount || '0')}
          />
        </label>
        <CurrencySelect value={fromCurrency} onChange={onFromChange} align="right" />
      </div>

      {/* ── Rule, swap, rate ── */}
      <div className="my-3 flex items-center gap-3 sm:my-4">
        <button
          onClick={onSwap}
          title="Swap currencies (Alt+S)"
          aria-label="Swap currencies"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong bg-paper text-ink-2 transition-all duration-300 hover:rotate-180 hover:border-accent hover:text-accent"
        >
          <ArrowsUpDownIcon className="h-4 w-4" />
        </button>
        <div className="h-px flex-1 bg-line-strong" />
        {data && !isSame && (
          <p className="flex shrink-0 items-baseline gap-2 text-sm text-ink-2 tabular-nums">
            <span>
              1 {fromCurrency} = {formatRate(rate)} {toCurrency}
            </span>
            {change && change.direction !== 'flat' && (
              <span className={change.direction === 'up' ? 'text-up' : 'text-down'}>
                {change.direction === 'up' ? '▲' : '▼'}
                {Math.abs(change.percent).toFixed(2)}%
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── To ── */}
      <div className="flex items-center gap-3">
        <div
          className="flex min-w-0 flex-1 items-start gap-1.5"
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            aria-hidden="true"
            className="shrink-0 self-start pt-[0.3em] text-2xl leading-none font-light text-ink-3 select-none sm:text-3xl"
          >
            {to?.symbol}
          </span>
          {isSame ? (
            <span className="text-6xl t-figure text-ink-3">-</span>
          ) : isLoading ? (
            <span className="h-[1em] w-48 animate-pulse rounded-lg bg-paper-3 text-6xl" />
          ) : isError ? (
            <span className="text-base text-down">Rate unavailable right now</span>
          ) : (
            <AnimatedNumber
              value={result}
              decimals={2}
              duration={400}
              className="min-w-0 truncate t-figure text-accent"
              style={figureSize(resultText)}
            />
          )}
        </div>
        <CurrencySelect value={toCurrency} onChange={onToChange} align="right" />
      </div>

      {/* ── Quick amounts + actions ── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div role="group" aria-label="Quick amounts" className="flex flex-wrap gap-1.5">
          {chipsFor(rate).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onAmountChange(String(a))}
              aria-pressed={numAmount === a}
              aria-label={`${a.toLocaleString()} ${fromCurrency}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-colors ${
                numAmount === a
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line-strong text-ink-2 hover:border-ink-2 hover:text-ink'
              }`}
            >
              {compact(a)}
            </button>
          ))}
        </div>
        <div className="-mx-3 flex items-center">
          <button
            type="button"
            onClick={handleCopy}
            className={action}
            aria-label="Copy converted amount"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-up" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={action}
            aria-label="Share this conversion"
          >
            {shared ? <CheckIcon className="h-4 w-4 text-up" /> : <LinkIcon className="h-4 w-4" />}
            {shared ? 'Link copied' : 'Share'}
          </button>
          <button
            type="button"
            onClick={() => setAlertOpen((o) => !o)}
            disabled={isSame || !rate}
            aria-expanded={alertOpen}
            aria-label="Set a rate alert for this pair"
            className={`${action} ${alertOpen ? 'bg-accent-tint text-accent' : ''}`}
          >
            <BellIcon className="h-4 w-4" />
            Alert
          </button>
        </div>
      </div>

      {data && !isSame && (
        <p className="mt-4 text-xs text-ink-3">
          Mid-market rate as of <time dateTime={data.date}>{formatDate(data.date)}</time>. Banks and
          cards add a margin.
        </p>
      )}

      {alertOpen && !isSame && rate > 0 && (
        // Keyed on the pair so switching currencies resets the suggested threshold
        <RateAlert
          key={`${fromCurrency}-${toCurrency}`}
          base={fromCurrency}
          target={toCurrency}
          rate={rate}
        />
      )}
    </div>
  );
}

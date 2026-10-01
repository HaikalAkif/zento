'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import type { RateResponse } from '@/lib/api';
import { parseCommand, resolveCommand } from '@/lib/command';
import { getCurrency } from '@/lib/currencies';
import { decimalsFor, formatAmount, formatDate, formatPlain, formatRate } from '@/lib/format';
import { pairHref } from '@/lib/paths';
import { prefersReducedMotion } from '@/lib/motion';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { useRateChange } from '@/hooks/useRateChange';
import { useTypewriter } from '@/hooks/useTypewriter';
import AnimatedNumber from './AnimatedNumber';
import RateAlert from './RateAlert';

// "Just type": the command line is the converter. Whatever you type is parsed on every
// keystroke and applied at once, so "100", "100 eur" and "¥30k in ringgit" all work
// without a submit. The picked currencies below the figure are the other way in.

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  amount: string;
  from: string;
  to: string;
  localCurrency: string;
  seedRates?: RateResponse;
  /** Apply a parsed query. Only called when it actually changes something. */
  onApply: (from: string, to: string, amount: string) => void;
  onPick: (side: 'from' | 'to') => void;
  onSwap: () => void;
  /** Extra control at the end of the input, e.g. the price scanner */
  trailing?: ReactNode;
}

function examplesFor(local: string): string[] {
  const own = local === 'USD' ? '100 usd in euros' : `100 usd in ${local.toLowerCase()}`;
  return [
    own,
    '150 euro in ringgit',
    '¥30k to sgd',
    'hotel ¥45,000 split 3 ways',
    '100 euro to argentina',
    '1.5m idr in usd',
  ];
}

/** Show a confirmation ("Copied") briefly. */
function flash(set: (v: boolean) => void): void {
  set(true);
  setTimeout(() => set(false), 1600);
}

/**
 * The animated placeholder. Its own component so the typing ticks (every 25-55ms)
 * re-render just this span, not the whole converter.
 */
function TypedPlaceholder({ phrases, active }: { phrases: string[]; active: boolean }) {
  const typed = useTypewriter(phrases, active);
  if (!typed) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-2xl tracking-tight whitespace-nowrap text-ink-3 sm:text-3xl"
    >
      {typed}
      <span className="ml-0.5 inline-block h-[1em] w-px animate-pulse bg-ink-2" />
    </span>
  );
}

/** The figure shrinks as it gets longer, so 30,000,000.00 still fits a phone. */
function figureSize(text: string): React.CSSProperties {
  const len = Math.max(text.length, 4);
  // The floor is low enough for 17-character results on a 320px phone
  return { fontSize: `clamp(1.5rem, ${Math.min(19, 118 / len)}vw, ${Math.min(8.5, 58 / len)}rem)` };
}

export default function Converter({
  query,
  onQueryChange,
  amount,
  from,
  to,
  localCurrency,
  seedRates,
  onApply,
  onPick,
  onSwap,
  trailing,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion()); // oxlint-disable-line react/set-state-in-effect -- matchMedia is client-only
  }, []);

  const examples = useMemo(() => examplesFor(localCurrency), [localCurrency]);
  const showTyped = !focused && query === '' && !reducedMotion;

  const numAmount = parseFloat(amount) || 0;
  const parsed = useMemo(() => parseCommand(query), [query]);

  // Typing is the event: parse each keystroke and apply it straight away, resolving
  // anything the query leaves out ("in yen" has no amount) from the current state.
  const handleChange = (text: string) => {
    onQueryChange(text);
    const next = parseCommand(text);
    if (!next) return;
    const r = resolveCommand(next, { from, to, amount: numAmount || 1 }, localCurrency);
    const nextAmount = String(r.amount);
    if (r.from !== from || r.to !== to || nextAmount !== amount) onApply(r.from, r.to, nextAmount);
  };

  // "/" or Cmd/Ctrl+K jumps to the input from anywhere outside a text field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { data, isLoading, isError } = useCurrencyRate(from, to, seedRates);
  const { data: change } = useRateChange(from, to);
  const isSame = from === to;
  const rate = isSame ? 1 : data?.rates[to];
  const result = rate != null ? numAmount * rate : null;
  const resultText = result != null ? formatAmount(result) : '';
  // Loaded, but the provider has no rate for this target: an error, not a wait
  const missingRate = !isSame && !isLoading && data != null && rate == null;
  const toName = getCurrency(to)?.name ?? to;
  const unparsed = query.trim() !== '' && !parsed;

  const copy = useCallback(async () => {
    if (result == null) return;
    try {
      await navigator.clipboard.writeText(result.toFixed(decimalsFor(result)));
      flash(setCopied);
    } catch {
      // Clipboard blocked (permissions, insecure context): nothing useful to show
    }
  }, [result]);

  const share = useCallback(async () => {
    // Built from what's on screen: the address bar only catches up after a debounce
    const url = `${window.location.origin}${pairHref(from, to, amount)}`;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: `${from} to ${to} on Zento`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash(setShared);
    } catch {
      // Share sheet dismissed or clipboard blocked
    }
  }, [from, to, amount]);

  const action = 'hit text-ink-3 transition-colors hover:text-ink disabled:opacity-40';

  return (
    <div>
      {/* ── The one input ── */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          inputRef.current?.blur();
        }}
        className="flex items-center gap-3 border-b border-line pb-3"
      >
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onQueryChange('');
                inputRef.current?.blur();
              }
            }}
            // Nothing once active; the typed overlay stands in while idle, or a static
            // hint with reduced motion (and before hydration).
            placeholder={reducedMotion && !focused ? 'Type an amount, like 150 euro in yen' : ''}
            aria-label="Type an amount and currencies, for example 150 euro in ringgit"
            aria-describedby="converter-hint"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            className="w-full bg-transparent text-2xl tracking-tight text-ink placeholder:text-ink-3 sm:text-3xl"
          />
          <TypedPlaceholder phrases={examples} active={showTyped} />
        </div>
        {trailing}
      </form>
      <p id="converter-hint" aria-live="polite" className="mt-2 min-h-5 t-label text-ink-3">
        {unparsed
          ? 'Try an amount and a currency, like "50 pounds in yen"'
          : parsed?.splitBy && result != null
            ? `Split ${parsed.splitBy} ways: ${formatAmount(result / parsed.splitBy)} ${to} each`
            : ''}
      </p>

      {/* ── The answer ── */}
      <div className="mt-8 sm:mt-12">
        <p className="flex flex-wrap items-baseline gap-x-2 text-lg text-ink-2 tabular-nums sm:text-xl">
          <span>{formatPlain(numAmount)}</span>
          <button
            type="button"
            onClick={() => onPick('from')}
            aria-label={`Convert from ${getCurrency(from)?.name ?? from}. Change`}
            className="hit inline-flex items-baseline gap-0.5 text-ink underline decoration-line-strong decoration-dotted underline-offset-4 hover:decoration-ink-2"
          >
            {from}
            <ChevronDownIcon aria-hidden="true" className="h-4 w-4 self-center text-ink-3" />
          </button>
          <span>=</span>
        </p>

        <div className="mt-3 min-h-[1em]" aria-live="polite" aria-atomic="true">
          {(isError && !data) || missingRate ? (
            <p className="text-lg text-down">
              {missingRate
                ? `There's no live rate for ${from} to ${to} right now.`
                : 'Rates are unavailable right now. Try again shortly.'}
            </p>
          ) : result == null || isLoading ? (
            <span
              className="block h-[0.9em] w-3/5 animate-pulse rounded-lg bg-paper-2"
              style={figureSize('0,000.00')}
            />
          ) : (
            <AnimatedNumber
              value={result}
              decimals={decimalsFor(result)}
              duration={350}
              className="block t-figure text-accent"
              style={figureSize(resultText)}
            />
          )}
        </div>

        <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-lg text-ink-2 sm:text-xl">
          <button
            type="button"
            onClick={() => onPick('to')}
            aria-label={`Convert to ${toName}. Change`}
            className="hit inline-flex items-baseline gap-0.5 text-ink underline decoration-line-strong decoration-dotted underline-offset-4 hover:decoration-ink-2"
          >
            {to}
            <ChevronDownIcon aria-hidden="true" className="h-4 w-4 self-center text-ink-3" />
          </button>
          <span>{toName}</span>
        </p>
      </div>

      {/* ── Rate and actions ── */}
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 t-label">
        <p className="text-ink-3 tabular-nums">
          {data && !isSame ? (
            <>
              1 {from} = {formatRate(data.rates[to] ?? 0)} {to}
              {change && change.direction !== 'flat' && (
                <span className={change.direction === 'up' ? 'text-up' : 'text-down'}>
                  {' '}
                  {change.direction === 'up' ? '+' : '−'}
                  {Math.abs(change.percent).toFixed(2)}% today
                </span>
              )}
              <span> · {formatDate(data.date)}</span>
            </>
          ) : (
            ' '
          )}
        </p>
        <div className="flex gap-5">
          <button type="button" onClick={onSwap} className={action} title="Swap (Alt+S)">
            Swap
          </button>
          <button type="button" onClick={copy} className={action} disabled={result == null}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={share} className={action}>
            {shared ? 'Link copied' : 'Share'}
          </button>
          <button
            type="button"
            onClick={() => setAlertOpen((o) => !o)}
            aria-expanded={alertOpen}
            disabled={isSame || !rate}
            className={`${action} ${alertOpen ? '!text-ink' : ''}`}
          >
            Alert
          </button>
        </div>
      </div>

      {alertOpen && !isSame && rate != null && rate > 0 && (
        // Keyed on the pair so switching currencies resets the suggested threshold
        <RateAlert key={`${from}-${to}`} base={from} target={to} rate={rate} />
      )}
    </div>
  );
}

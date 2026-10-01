'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { QuestionMarkCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { RateResponse } from '@/lib/api';
import { interpretQuery, parseCommand } from '@/lib/command';
import { decimalsFor, formatAmount, formatDate, formatPlain, formatRate } from '@/lib/format';
import { pairHref } from '@/lib/paths';
import { currencyName, localePath } from '@/lib/i18n';
import { useLang } from './LangProvider';
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
      className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-xl tracking-tight whitespace-nowrap text-ink-3 sm:text-2xl"
    >
      {typed}
      <span className="ml-0.5 inline-block h-[1em] w-px animate-pulse bg-ink-2" />
    </span>
  );
}

/**
 * Size the figure to fit its own column, not the viewport: on desktop the converter
 * sits in half the screen. cqi is 1% of the container's width (the converter is an
 * inline-size container). Geist's light tabular digits are ~0.6em wide, so N
 * characters fill the width at about 165/N cqi.
 */
function figureSize(text: string): React.CSSProperties {
  const len = Math.max(text.length, 4);
  return {
    fontSize: `clamp(1.25rem, ${Math.min(24, 165 / len)}cqi, ${Math.min(8.5, 58 / len)}rem)`,
  };
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
  const { lang, t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion()); // oxlint-disable-line react/set-state-in-effect -- matchMedia is client-only
  }, []);

  const examples = useMemo(() => t.converter.examples(localCurrency), [t, localCurrency]);
  const showTyped = !focused && query === '' && !reducedMotion;

  const numAmount = parseFloat(amount) || 0;
  const parsed = useMemo(() => parseCommand(query), [query]);

  // Typing is the event: parse each keystroke and apply it straight away, resolving
  // anything the query leaves out ("in yen" has no amount) from the current state.
  const handleChange = (text: string) => {
    onQueryChange(text);
    const r = interpretQuery(text, { from, to, amount: numAmount || 1 }, localCurrency);
    if (!r) return;
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
  const toName = currencyName(to, lang);
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
    const url = `${window.location.origin}${pairHref(from, to, amount, lang)}`;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: t.converter.shareTitle(from, to), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash(setShared);
    } catch {
      // Share sheet dismissed or clipboard blocked
    }
  }, [from, to, amount, lang, t]);

  const action = 'hit text-ink-3 transition-colors hover:text-ink disabled:opacity-40';

  return (
    // Container for the figure's cqi sizing
    <div className="@container">
      {/* ── The one input ── */}
      <label htmlFor="converter-input" className="mb-2 block t-label text-ink-3">
        {t.converter.label}
      </label>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          inputRef.current?.blur();
        }}
        // A filled field reads as "type here" at a glance; it deliberately doesn't change
        // on focus (the caret is the focus indicator)
        className="flex items-center gap-3 rounded-2xl bg-paper-3 py-3 pr-2 pl-4"
      >
        <SparklesIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-3" />
        <div className="relative min-w-0 flex-1">
          <input
            id="converter-input"
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
            placeholder={reducedMotion && !focused ? t.converter.staticPlaceholder : ''}
            aria-describedby="converter-hint"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            className="w-full bg-transparent text-xl tracking-tight text-ink placeholder:text-ink-3 sm:text-2xl"
          />
          <TypedPlaceholder phrases={examples} active={showTyped} />
        </div>
        {trailing}
        <Link
          href={localePath(lang, '/guide')}
          aria-label={t.converter.guideButton}
          title={t.converter.guideTitle}
          className="hit shrink-0 p-1 text-ink-3 transition-colors hover:text-ink"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
        </Link>
      </form>
      <p id="converter-hint" aria-live="polite" className="mt-3 min-h-5 t-label text-ink-3">
        {unparsed ? (
          t.converter.unparsed
        ) : parsed?.splitBy && result != null ? (
          t.converter.split(parsed.splitBy, formatAmount(result / parsed.splitBy), to)
        ) : query === '' ? (
          <>
            {t.converter.tryWord}{' '}
            {t.converter.tryExamples.map((example, i) => (
              <span key={example}>
                {i > 0 && <span aria-hidden="true"> · </span>}
                <button
                  type="button"
                  onClick={() => {
                    handleChange(example);
                    inputRef.current?.focus();
                  }}
                  className="hit text-ink-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
                >
                  {example}
                </button>
              </span>
            ))}
          </>
        ) : (
          ''
        )}
      </p>

      {/* ── The answer ── */}
      <div className="mt-8 sm:mt-12">
        <p className="flex flex-wrap items-baseline gap-x-2 text-lg text-ink-2 tabular-nums sm:text-xl">
          <span>{formatPlain(numAmount)}</span>
          <button
            type="button"
            onClick={() => onPick('from')}
            aria-label={t.converter.pickFrom(currencyName(from, lang))}
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
              {missingRate ? t.converter.noRate(from, to) : t.converter.unavailable}
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
            aria-label={t.converter.pickTo(toName)}
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
                  {Math.abs(change.percent).toFixed(2)}% {t.converter.today}
                </span>
              )}
              <span> · {formatDate(data.date, lang)}</span>
            </>
          ) : (
            ' '
          )}
        </p>
        <div className="flex gap-5">
          <button type="button" onClick={onSwap} className={action} title={t.converter.swapTitle}>
            {t.converter.swap}
          </button>
          <button type="button" onClick={copy} className={action} disabled={result == null}>
            {copied ? t.converter.copied : t.converter.copy}
          </button>
          <button type="button" onClick={share} className={action}>
            {shared ? t.converter.linkCopied : t.converter.share}
          </button>
          <button
            type="button"
            onClick={() => setAlertOpen((o) => !o)}
            aria-expanded={alertOpen}
            disabled={isSame || !rate}
            className={`${action} ${alertOpen ? '!text-ink' : ''}`}
          >
            {t.converter.alert}
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

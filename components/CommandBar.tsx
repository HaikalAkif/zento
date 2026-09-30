'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { parseCommand, resolveCommand } from '@/lib/command';
import { getCurrency } from '@/lib/currencies';
import { formatAmount } from '@/lib/format';
import { prefersReducedMotion } from '@/lib/motion';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { useTypewriter } from '@/hooks/useTypewriter';

interface Props {
  from: string;
  to: string;
  amount: string;
  localCurrency: string;
  onApply: (from: string, to: string, amount: string) => void;
  /** Extra controls on the right of the bar, e.g. the price scanner */
  trailing?: ReactNode;
}

const STATIC_PLACEHOLDER = 'Try "150 euro in ringgit"';

function examplesFor(local: string): string[] {
  const own = local === 'USD' ? '100 usd in euros' : `100 usd in ${local.toLowerCase()}`;
  return [
    own,
    '150 euro in ringgit',
    '¥30k to sgd',
    'hotel ¥45,000 split 3 ways',
    '$2,500 to yen',
    '1.5m idr in usd',
    '500 pounds to dollars',
  ];
}

function money(code: string, value: number): string {
  const symbol = getCurrency(code)?.symbol ?? '';
  return `${symbol}${formatAmount(value)} ${code}`;
}

export default function CommandBar({ from, to, amount, localCurrency, onApply, trailing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion()); // oxlint-disable-line react/set-state-in-effect -- matchMedia is client-only
  }, []);

  // The animated placeholder runs only while the bar is idle. It vanishes on focus.
  const examples = useMemo(() => examplesFor(localCurrency), [localCurrency]);
  const typed = useTypewriter(examples, !focused && value === '' && !reducedMotion);

  const resolved = useMemo(() => {
    const parsed = parseCommand(value);
    if (!parsed) return null;
    return resolveCommand(parsed, { from, to, amount: parseFloat(amount) || 1 }, localCurrency);
  }, [value, from, to, amount, localCurrency]);

  const { data, isLoading } = useCurrencyRate(resolved?.from ?? from, resolved?.to ?? to);
  const rate = resolved ? data?.rates[resolved.to] : undefined;

  // "/" or Cmd/Ctrl+K jumps to the bar from anywhere outside a text field
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

  const apply = () => {
    if (!resolved) return;
    onApply(resolved.from, resolved.to, String(resolved.amount));
    setValue('');
  };

  let preview: string | null = null;
  if (resolved && value.trim()) {
    if (rate != null) {
      const total = resolved.amount * rate;
      preview = `${money(resolved.from, resolved.amount)} = ${money(resolved.to, total)}`;
      if (resolved.splitBy) preview += ` · ${money(resolved.to, total / resolved.splitBy)} each`;
    } else if (isLoading) {
      preview = 'Converting…';
    }
  } else if (value.trim()) {
    preview = 'Try an amount and a currency, like "50 pounds in yen"';
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="mx-auto mb-4 w-full max-w-2xl"
    >
      <div
        className={`relative flex items-center gap-3 rounded-2xl border bg-slate-900/60 px-4 py-3 backdrop-blur-md transition-all duration-300 ${
          focused
            ? 'border-blue-500/70 shadow-[0_0_0_4px_rgba(59,130,246,0.15),0_0_40px_-8px_rgba(59,130,246,0.5)]'
            : 'border-slate-700/60 hover:border-slate-600'
        }`}
      >
        <SparklesIcon
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 transition-colors ${focused ? 'text-blue-400' : 'text-slate-500'}`}
        />
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setValue('');
                inputRef.current?.blur();
              }
            }}
            // Nothing once active. When idle, the typed overlay stands in, or this static
            // hint for reduced motion (and before hydration, when motion is unknown).
            placeholder={reducedMotion && !focused ? STATIC_PLACEHOLDER : ''}
            aria-label="Ask a conversion, for example 150 euro in ringgit"
            aria-describedby="command-preview"
            autoComplete="off"
            spellCheck={false}
            className="w-full border-none bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
          />
          {typed && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-base whitespace-nowrap text-slate-500"
            >
              {typed}
              <span className="ml-px inline-block h-5 w-[2px] animate-pulse bg-blue-400/80" />
            </span>
          )}
        </div>
        {trailing}
        {resolved && value.trim() ? (
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Convert ↵
          </button>
        ) : (
          <kbd className="hidden shrink-0 items-center rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 sm:inline-flex">
            /
          </kbd>
        )}
      </div>
      <p
        id="command-preview"
        aria-live="polite"
        className={`mt-2 min-h-5 text-center text-sm tabular-nums transition-opacity ${
          preview ? 'opacity-100' : 'opacity-0'
        } ${rate != null && resolved ? 'text-slate-200' : 'text-slate-400'}`}
      >
        {preview}
      </p>
    </form>
  );
}

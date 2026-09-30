'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CurrencyConverter from './CurrencyConverter';
import PopularConversions from './PopularConversions';
import MultiCurrencyResults from './MultiCurrencyResults';
import RecentPairs from './RecentPairs';
import VantaGlobe from './VantaGlobe';
import CommandBar from './CommandBar';
import PriceScanner from './PriceScanner';
import TimeMachine from './TimeMachine';
import CurrencyGlobe from './CurrencyGlobe';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { CURRENCIES, hasHistory, pairHasHistory } from '@/lib/currencies';
import { PAIR_COOKIE, multiTargetsFor, popularPairsFor } from '@/lib/region';
import type { RateResponse } from '@/lib/api';
import { prefersReducedMotion } from '@/lib/motion';

// Recharts is ~450 kB. The chart sits below the fold, so keep it out of the initial bundle.
const RateTrendChart = dynamic(() => import('./RateTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[360px] rounded-2xl border border-slate-800 bg-slate-900" />,
});

interface Props {
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: string;
  heroMode?: boolean;
  /** Pass JSX from a server component to render inside the Vanta hero on pair pages. */
  heroContent?: ReactNode;
  /** Visitor's home currency, detected server-side from their region. */
  localCurrency?: string;
  /** Server-fetched rates for the initial pair, so the result is in the first HTML. */
  seedRates?: RateResponse;
}

/** Remember the pair so the home page opens on it next visit. Read server-side. */
function rememberPair(from: string, to: string): void {
  if (from === to) return;
  document.cookie = `${PAIR_COOKIE}=${from}-${to}; path=/; max-age=31536000; samesite=lax`;
}

function buildPairUrl(from: string, to: string, amount: string): string {
  const slug = `${from.toLowerCase()}-to-${to.toLowerCase()}`;
  const n = parseFloat(amount);
  return !isNaN(n) && amount !== '1' ? `/${slug}?amount=${amount}` : `/${slug}`;
}

export default function ConverterSection({
  initialFrom = 'USD',
  initialTo = 'EUR',
  initialAmount = '1',
  heroMode = false,
  heroContent,
  localCurrency = 'USD',
  seedRates,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);

  const { history, add: addToHistory } = useConversionHistory();

  const popularPairs = useMemo(() => popularPairsFor(localCurrency), [localCurrency]);
  const multiTargets = useMemo(() => multiTargetsFor(localCurrency), [localCurrency]);

  // Landing on a pair page (often straight from search) counts as using that pair
  useEffect(() => {
    if (!heroMode) rememberPair(initialFrom, initialTo);
  }, []); // oxlint-disable-line react/exhaustive-deps, react/exhaustive-effect-dependencies

  // Refs hold previous values to detect real changes vs initial mount
  const prevCurrencyRef = useRef<{ from: string; to: string } | null>(null);
  const prevAmountRef = useRef<string | null>(null);

  // Sync ?amount from URL on first mount (pair pages no longer read searchParams server-side)
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('amount');
    if (!raw) return;
    const n = parseFloat(raw);
    if (isNaN(n) || n <= 0 || raw === initialAmount) return;
    prevAmountRef.current = raw; // prevent URL-update effect from firing a redundant replace
    setAmount(raw); // oxlint-disable-line react/set-state-in-effect -- hydrates from window.location, unavailable during SSR
  }, []); // oxlint-disable-line react/exhaustive-deps, react/exhaustive-effect-dependencies

  // Alt+S keyboard shortcut: swap currencies
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't hijack the shortcut while the user is typing in a field
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))
        return;
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fromCurrency, toCurrency]);

  // Navigate + save to history when currencies change. Immediate, no debounce.
  useEffect(() => {
    const prev = prevCurrencyRef.current;
    prevCurrencyRef.current = { from: fromCurrency, to: toCurrency };
    if (!prev || (prev.from === fromCurrency && prev.to === toCurrency)) return;

    if (fromCurrency !== toCurrency) addToHistory(fromCurrency, toCurrency);
    rememberPair(fromCurrency, toCurrency);

    const url = buildPairUrl(fromCurrency, toCurrency, amount);
    if (heroMode) router.push(url);
    else router.replace(url);
  }, [fromCurrency, toCurrency, amount, heroMode, router, addToHistory]);

  // Update URL when amount changes. Debounced 600ms, pair pages only.
  useEffect(() => {
    const prev = prevAmountRef.current;
    prevAmountRef.current = amount;
    if (heroMode || prev === null || prev === amount) return;

    const timer = setTimeout(() => {
      router.replace(buildPairUrl(fromCurrency, toCurrency, amount));
    }, 600);
    return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency, heroMode, router]);

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const handleCommand = useCallback((from: string, to: string, value: string) => {
    setFromCurrency(from);
    setToCurrency(to);
    setAmount(value);
  }, []);

  const handleSelect = useCallback((from: string, to: string) => {
    setFromCurrency(from);
    setToCurrency(to);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  const commandBar = (
    <CommandBar
      from={fromCurrency}
      to={toCurrency}
      amount={amount}
      localCurrency={localCurrency}
      onApply={handleCommand}
      trailing={
        <PriceScanner
          from={fromCurrency}
          to={toCurrency}
          localCurrency={localCurrency}
          onApply={handleCommand}
        />
      }
    />
  );

  // The globe compares year-on-year ECB rates, so it needs an ECB currency as home
  const globeBase = hasHistory(localCurrency) ? localCurrency : 'USD';

  const converterCard = (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-800/50 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
      <CurrencyConverter
        amount={amount}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        onAmountChange={setAmount}
        onFromChange={setFromCurrency}
        onToChange={setToCurrency}
        onSwap={handleSwap}
        seedRates={seedRates}
      />
    </div>
  );

  const belowFold = (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-16 sm:px-6">
      <RecentPairs items={history} onSelect={handleSelect} />
      <PopularConversions pairs={popularPairs} onSelect={handleSelect} />
      {fromCurrency !== toCurrency && (
        <RateTrendChart fromCurrency={fromCurrency} toCurrency={toCurrency} />
      )}
      {pairHasHistory(fromCurrency, toCurrency) && (
        <TimeMachine fromCurrency={fromCurrency} toCurrency={toCurrency} amount={amount} />
      )}
      <MultiCurrencyResults
        fromCurrency={fromCurrency}
        amount={amount}
        targets={multiTargets}
        onSelect={handleSelect}
      />
      <CurrencyGlobe base={globeBase} onSelect={handleSelect} />
    </div>
  );

  if (heroMode || heroContent != null) {
    const heroInner = heroContent ?? (
      <>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-slate-50 sm:mb-2 sm:text-5xl">
          Zento: currency, converted instantly.
        </h1>
        <p className="text-sm text-slate-400 sm:text-base">
          {CURRENCIES.length} currencies. Live rates. Zero fees.
        </p>
      </>
    );

    return (
      <>
        <section className="relative flex min-h-dvh flex-col items-center justify-center px-4 pt-20 pb-16 sm:px-6 sm:py-24">
          <VantaGlobe />
          <div className="pointer-events-none absolute inset-0 -z-5 bg-linear-to-b from-slate-950/75 to-slate-950/95" />
          <div className="mb-6 text-center sm:mb-8">{heroInner}</div>
          {commandBar}
          {converterCard}
        </section>
        {belowFold}
      </>
    );
  }

  return (
    <div className="pt-20 pb-4">
      <div className="mx-auto mb-8 max-w-2xl px-4 sm:px-6">
        {commandBar}
        {converterCard}
      </div>
      {belowFold}
    </div>
  );
}

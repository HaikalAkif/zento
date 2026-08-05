'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CurrencyConverter from './CurrencyConverter';
import PopularConversions from './PopularConversions';
import MultiCurrencyResults from './MultiCurrencyResults';
import RecentPairs from './RecentPairs';
import VantaGlobe from './VantaGlobe';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { CURRENCIES } from '@/lib/currencies';
import { prefersReducedMotion } from '@/lib/motion';

// Recharts is ~450 kB. The chart sits below the fold, so keep it out of the initial bundle.
const RateTrendChart = dynamic(() => import('./RateTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[360px] rounded-2xl bg-slate-900 border border-slate-800" />,
});

interface Props {
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: string;
  heroMode?: boolean;
  /** Pass JSX from a server component to render inside the Vanta hero on pair pages. */
  heroContent?: ReactNode;
}

function buildPairUrl(from: string, to: string, amount: string): string {
  const slug = `${from.toLowerCase()}-to-${to.toLowerCase()}`;
  const n = parseFloat(amount);
  return !isNaN(n) && amount !== '1' ? `/${slug}?amount=${amount}` : `/${slug}`;
}

export default function ConverterSection({
  initialFrom = 'USD',
  initialTo = 'MYR',
  initialAmount = '1',
  heroMode = false,
  heroContent,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);

  const { history, add: addToHistory } = useConversionHistory();

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
    setAmount(raw); // eslint-disable-line react-hooks/set-state-in-effect -- hydrates from window.location, unavailable during SSR
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Alt+S keyboard shortcut: swap currencies
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't hijack the shortcut while the user is typing in a field
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
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

  const handleSelect = useCallback((from: string, to: string) => {
    setFromCurrency(from);
    setToCurrency(to);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  const converterCard = (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/70 backdrop-blur-md border border-slate-800/50 rounded-2xl shadow-2xl p-6 sm:p-8">
      <CurrencyConverter
        amount={amount}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        onAmountChange={setAmount}
        onFromChange={setFromCurrency}
        onToChange={setToCurrency}
        onSwap={handleSwap}
      />
    </div>
  );

  const belowFold = (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-5">
      <RecentPairs items={history} onSelect={handleSelect} />
      <PopularConversions onSelect={handleSelect} />
      {fromCurrency !== toCurrency && (
        <RateTrendChart fromCurrency={fromCurrency} toCurrency={toCurrency} />
      )}
      <MultiCurrencyResults fromCurrency={fromCurrency} amount={amount} onSelect={handleSelect} />
    </div>
  );

  if (heroMode || heroContent != null) {
    const heroInner = heroContent ?? (
      <>
        <h1 className="text-2xl sm:text-5xl font-bold text-slate-50 tracking-tight mb-1.5 sm:mb-2">
          Zento: currency, converted instantly.
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          {CURRENCIES.length} currencies. Live rates. Zero fees.
        </p>
      </>
    );

    return (
      <>
        <section className="relative min-h-dvh flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-16 sm:py-24">
          <VantaGlobe />
          <div className="absolute inset-0 -z-5 bg-linear-to-b from-slate-950/75 to-slate-950/95 pointer-events-none" />
          <div className="text-center mb-6 sm:mb-10">
            {heroInner}
          </div>
          {converterCard}
        </section>
        {belowFold}
      </>
    );
  }

  return (
    <div className="pt-20 pb-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-8">
        {converterCard}
      </div>
      {belowFold}
    </div>
  );
}

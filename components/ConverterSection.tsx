'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CurrencyConverter from './CurrencyConverter';
import PopularConversions from './PopularConversions';
import RateTrendChart from './RateTrendChart';
import MultiCurrencyResults from './MultiCurrencyResults';
import RecentPairs from './RecentPairs';
import VantaGlobe from './VantaGlobe';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { CURRENCIES } from '@/lib/currencies';

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
  initialFrom = 'JPY',
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

  // Alt+S keyboard shortcut — swap currencies
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fromCurrency, toCurrency]);

  // Navigate + save to history when currencies change — immediate, no debounce
  useEffect(() => {
    const prev = prevCurrencyRef.current;
    prevCurrencyRef.current = { from: fromCurrency, to: toCurrency };
    if (!prev || (prev.from === fromCurrency && prev.to === toCurrency)) return;

    if (fromCurrency !== toCurrency) addToHistory(fromCurrency, toCurrency);

    const url = buildPairUrl(fromCurrency, toCurrency, amount);
    if (heroMode) router.push(url);
    else router.replace(url);
  }, [fromCurrency, toCurrency, amount, heroMode, router, addToHistory]);

  // Update URL when amount changes — debounced 600ms, pair pages only
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <RateTrendChart fromCurrency={fromCurrency} toCurrency={toCurrency} />
      <MultiCurrencyResults fromCurrency={fromCurrency} amount={amount} onSelect={handleSelect} />
    </div>
  );

  if (heroMode || heroContent != null) {
    const heroInner = heroContent ?? (
      <>
        <h1 className="text-2xl sm:text-5xl font-bold text-slate-50 tracking-tight mb-1.5 sm:mb-2">
          Convert Currency Instantly
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Live exchange rates for {CURRENCIES.length} currencies
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
    <div className="space-y-5">
      {converterCard}
      <div className="space-y-5 pt-8">{belowFold}</div>
    </div>
  );
}

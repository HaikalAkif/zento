'use client';

import { useState, useCallback, useEffect } from 'react';
import CurrencyConverter from './CurrencyConverter';
import PopularConversions from './PopularConversions';
import RateTrendChart from './RateTrendChart';
import MultiCurrencyResults from './MultiCurrencyResults';
import { CURRENCIES } from '@/lib/currencies';

interface Props {
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: string;
  heroMode?: boolean;
}

export default function ConverterSection({
  initialFrom = 'JPY',
  initialTo = 'MYR',
  initialAmount = '1',
  heroMode = false,
}: Props) {
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);

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

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const handlePopularSelect = useCallback((from: string, to: string) => {
    setFromCurrency(from);
    setToCurrency(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const converterCard = (
    <div className="w-full max-w-2xl mx-auto">
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
      <PopularConversions onSelect={handlePopularSelect} />
      <RateTrendChart fromCurrency={fromCurrency} toCurrency={toCurrency} />
      <MultiCurrencyResults fromCurrency={fromCurrency} amount={amount} />
    </div>
  );

  if (heroMode) {
    return (
      <>
        {/* Viewport-height hero: converter only */}
        <section className="relative min-h-dvh flex flex-col px-4 sm:px-6
          justify-start pt-20 sm:justify-center sm:pt-0 pb-12 sm:pb-0">
          {/* SEO headline */}
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-50 tracking-tight mb-1.5 sm:mb-2">
              Convert Currency Instantly
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">
              Live exchange rates for {CURRENCIES.length} currencies
            </p>
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

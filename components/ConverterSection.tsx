'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import CurrencyConverter from './CurrencyConverter';
import QuickAmounts from './QuickAmounts';
import PopularConversions from './PopularConversions';
import RateTrendChart from './RateTrendChart';
import MultiCurrencyResults from './MultiCurrencyResults';

interface Props {
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: string;
  heroMode?: boolean;
}

export default function ConverterSection({
  initialFrom = 'USD',
  initialTo = 'MYR',
  initialAmount = '100',
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
    <div className="w-full max-w-xl mx-auto">
      <CurrencyConverter
        amount={amount}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        onAmountChange={setAmount}
        onFromChange={setFromCurrency}
        onToChange={setToCurrency}
        onSwap={handleSwap}
      />
      <div className="mt-3.5 px-1">
        <QuickAmounts current={amount} onSelect={setAmount} />
      </div>
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
        <section className="relative min-h-dvh flex flex-col items-center justify-center px-4 sm:px-6 py-20">
          {converterCard}

          {/* Scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-700 select-none">
            <span className="text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
            <ChevronDownIcon className="w-4 h-4 animate-bounce" />
          </div>
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

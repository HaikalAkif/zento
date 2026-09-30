'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CurrencyConverter from './CurrencyConverter';
import RateTape from './RateTape';
import MultiCurrencyResults from './MultiCurrencyResults';
import RecentPairs from './RecentPairs';
import Seal from './Seal';
import Section from './Section';
import SectionNav, { type NavItem } from './SectionNav';
import CommandBar from './CommandBar';
import PriceScanner from './PriceScanner';
import TimeMachine from './TimeMachine';
import CurrencyGlobe from './CurrencyGlobe';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { CURRENCIES, getCurrency, hasHistory, pairHasHistory } from '@/lib/currencies';
import { PAIR_COOKIE, multiTargetsFor, popularPairsFor } from '@/lib/region';
import type { RateResponse } from '@/lib/api';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';
import { formatDate, formatRate } from '@/lib/format';
import { prefersReducedMotion } from '@/lib/motion';

// Recharts is ~450 kB. The chart sits below the fold, so keep it out of the initial bundle.
const RateTrendChart = dynamic(() => import('./RateTrendChart'), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-paper-2" />,
});

interface Props {
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: string;
  heroMode?: boolean;
  /** Pass JSX from a server component to render as the hero heading on pair pages. */
  heroContent?: ReactNode;
  /** Server-rendered pair facts (stats, tables, FAQ), shown as the last section */
  details?: ReactNode;
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
  details,
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

  const { data: rateData } = useCurrencyRate(fromCurrency, toCurrency, seedRates);
  const rate = rateData?.rates[toCurrency];
  const symbol = (code: string) => getCurrency(code)?.symbol ?? code;

  // The globe compares year-on-year ECB rates, so it needs an ECB currency as home
  const globeBase = hasHistory(localCurrency) ? localCurrency : 'USD';
  const hasHistoryData = pairHasHistory(fromCurrency, toCurrency);
  const numAmount = parseFloat(amount) || 1;

  // Only sections that can have data for this pair, numbered in order
  const sections: (NavItem & { render: () => ReactNode; title: ReactNode; kicker: ReactNode })[] = [
    ...(hasHistoryData
      ? [
          {
            id: 'trend',
            label: 'Trend',
            title: 'Trend',
            kicker: `How 1 ${fromCurrency} has moved against ${toCurrency}. ECB reference rates, each business day.`,
            render: () => <RateTrendChart fromCurrency={fromCurrency} toCurrency={toCurrency} />,
          },
          {
            id: 'then-and-now',
            label: 'Then & now',
            title: <>Then &amp; now</>,
            kicker: `What ${numAmount.toLocaleString('en-US')} ${fromCurrency} bought in ${toCurrency} years ago, against today.`,
            render: () => (
              <TimeMachine fromCurrency={fromCurrency} toCurrency={toCurrency} amount={amount} />
            ),
          },
        ]
      : []),
    {
      id: 'compare',
      label: 'Compare',
      title: 'What it buys',
      kicker: `${numAmount.toLocaleString('en-US')} ${getCurrency(fromCurrency)?.name ?? fromCurrency} in the currencies that matter to you. Tap one to switch.`,
      render: () => (
        <MultiCurrencyResults
          fromCurrency={fromCurrency}
          amount={amount}
          targets={multiTargets}
          onSelect={handleSelect}
        />
      ),
    },
    {
      id: 'globe',
      label: 'Globe',
      title: (
        <>
          Where your {globeBase} <span className="text-accent">goes further</span>
        </>
      ),
      kicker: `How much more or less ${getCurrency(globeBase)?.name ?? globeBase} buys around the world than a year ago. Drag to spin, tap to convert.`,
      render: () => <CurrencyGlobe base={globeBase} onSelect={handleSelect} />,
    },
    ...(details
      ? [
          {
            id: 'details',
            label: 'Details',
            title: 'The details',
            kicker: `Rates, ranges and conversion tables for ${fromCurrency} and ${toCurrency}.`,
            render: () => details,
          },
        ]
      : []),
  ];
  // Stable while the set of sections is unchanged, so the index doesn't re-observe on
  // every keystroke in the amount field
  const navKey = sections.map(({ id, label }) => `${id}:${label}`).join('|');
  const navItems = useMemo(
    () =>
      navKey.split('|').map((entry) => {
        const [id, label] = entry.split(':');
        return { id, label };
      }),
    [navKey],
  );

  const heading = heroContent ?? (
    <>
      <p className="t-label text-ink-3">{CURRENCIES.length} currencies · live mid-market · free</p>
      <h1 className="mt-3 t-h1 text-ink">
        Currency, <span className="text-accent">converted.</span>
      </h1>
    </>
  );

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-24 pb-10 sm:px-6 sm:pt-28 lg:grid-cols-12 lg:gap-14 lg:pb-16">
          <div className="relative z-10 lg:col-span-7">
            {heading}
            <div className="mt-7">
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
            </div>
            <div className="mt-4">
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
            <RecentPairs items={history} onSelect={handleSelect} />
          </div>

          {/* The pair's own seal. Behind the converter on phones, beside it on desktop. */}
          <div className="pointer-events-none absolute top-6 -right-[46vw] w-[92vw] max-w-[440px] opacity-[0.14] sm:-right-40 lg:pointer-events-auto lg:relative lg:top-auto lg:right-auto lg:col-span-5 lg:w-full lg:max-w-[480px] lg:justify-self-end lg:opacity-100">
            <Seal
              seed={`${fromCurrency}-${toCurrency}`}
              ring={`Zento · ${fromCurrency} ${toCurrency}${rate ? ` · 1 ${fromCurrency} = ${formatRate(rate)} ${toCurrency}` : ''} · mid-market${rateData ? ` · ${formatDate(rateData.date)}` : ''}`}
              center={`${symbol(fromCurrency)} · ${symbol(toCurrency)}`}
            />
          </div>
        </div>
      </section>

      <RateTape pairs={popularPairs} onSelect={handleSelect} />
      <SectionNav items={navItems} />

      {sections.map((section, i) => (
        <Section
          key={section.id}
          id={section.id}
          index={String(i + 1).padStart(2, '0')}
          title={section.title}
          kicker={section.kicker}
        >
          {section.render()}
        </Section>
      ))}
    </>
  );
}

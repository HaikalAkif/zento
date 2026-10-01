'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Converter from './Converter';
import CurrencyPicker from './CurrencyPicker';
import MultiCurrencyResults from './MultiCurrencyResults';
import PriceScanner from './PriceScanner';
import TimeMachine from './TimeMachine';
import CurrencyGlobe from './CurrencyGlobe';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { getCurrency, hasHistory, pairHasHistory } from '@/lib/currencies';
import { PAIR_COOKIE, multiTargetsFor } from '@/lib/region';
import type { RateResponse } from '@/lib/api';
import { prefersReducedMotion } from '@/lib/motion';
import { pairHref, pairPath, parsePairPath } from '@/lib/paths';
import { interpretQuery } from '@/lib/command';

// Recharts is ~450 kB. The chart sits below the fold, so keep it out of the initial bundle.
const RateTrendChart = dynamic(() => import('./RateTrendChart'), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-xl bg-paper-2" />,
});

interface Props {
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: string;
  /** Visually quiet h1: "Currency converter", "USD to MYR exchange rate" */
  heading: string;
  /** Server-rendered facts about the page's own pair (stats, tables, FAQ) */
  details?: ReactNode;
  /** Visitor's home currency, detected server-side from their region */
  localCurrency?: string;
  /** Server-fetched rates for the initial pair, so the result is in the first HTML */
  seedRates?: RateResponse;
}

/** Remember the pair so the home page opens on it next visit. Read server-side. */
function rememberPair(from: string, to: string): void {
  if (from === to) return;
  document.cookie = `${PAIR_COOKIE}=${from}-${to}; path=/; max-age=31536000; samesite=lax`;
}

/** Matches Tailwind's lg breakpoint, where the page splits into two panes. */
const SPLIT_LAYOUT = '(min-width: 1024px)';

function Block({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="mt-24 sm:mt-32 lg:mt-24 lg:first:mt-0"
    >
      <h2 id={`${id}-title`} className="mb-6 t-h2 text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ConverterSection({
  initialFrom = 'USD',
  initialTo = 'EUR',
  initialAmount = '1',
  heading,
  details,
  localCurrency = 'USD',
  seedRates,
}: Props) {
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const { history, add: addToHistory } = useConversionHistory();
  const multiTargets = useMemo(() => multiTargetsFor(localCurrency), [localCurrency]);
  const firstRender = useRef(true);

  // On mount the URL is the source of truth. It can name a different pair than the
  // server rendered: pairs are changed in place with replaceState, and Back restores
  // the originally rendered page under the newer URL.
  useEffect(() => {
    /* oxlint-disable react/set-state-in-effect -- hydrates from window.location, unavailable during SSR */
    // Only a pair of supported currencies counts; anything else keeps the server's pair
    const parsedPath = parsePairPath(window.location.pathname);
    const urlPair =
      parsedPath && getCurrency(parsedPath.from) && getCurrency(parsedPath.to) ? parsedPath : null;
    if (urlPair) {
      setFromCurrency(urlPair.from);
      setToCurrency(urlPair.to);
    }
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('amount');
    const urlAmount = raw && parseFloat(raw) > 0 ? raw : null;
    if (urlAmount && urlAmount !== initialAmount) setAmount(urlAmount);
    // ?q= opens with a query typed and applied (links from the guide, shared queries)
    const q = params.get('q')?.slice(0, 200);
    const r = q
      ? interpretQuery(
          q,
          {
            from: urlPair?.from ?? initialFrom,
            to: urlPair?.to ?? initialTo,
            amount: parseFloat(urlAmount ?? initialAmount) || 1,
          },
          localCurrency,
        )
      : null;
    if (q && r) {
      setQuery(q);
      setFromCurrency(r.from);
      setToCurrency(r.to);
      setAmount(String(r.amount));
    }
    /* oxlint-enable react/set-state-in-effect */
    // Landing on a pair page (often straight from search) counts as using that pair.
    // Not the home page: its pair is only a regional default nobody chose.
    if (details && initialFrom !== initialTo) rememberPair(initialFrom, initialTo);
  }, []); // oxlint-disable-line react/exhaustive-deps, react/exhaustive-effect-dependencies

  // Keep the URL, cookie and recents in step with what's shown. Debounced so typing
  // "100 usd in myr" doesn't record every intermediate pair. replaceState rather than
  // navigation: navigating would remount the page and steal the input mid-word.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (fromCurrency !== toCurrency) {
        addToHistory(fromCurrency, toCurrency);
        rememberPair(fromCurrency, toCurrency);
      }
      // Carry the amount: the new pair's default amount can differ
      window.history.replaceState(
        window.history.state,
        '',
        pairHref(fromCurrency, toCurrency, amount),
      );
      // The URL now names this pair, so the tab should too
      document.title = `${fromCurrency} to ${toCurrency}: Live Exchange Rate | Zento`;
    }, 500);
    return () => clearTimeout(timer);
  }, [fromCurrency, toCurrency, amount, addToHistory]);

  // Alt+S swaps, outside text fields
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))
        return;
      // e.code, not e.key: on macOS Option+S types "ß"
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fromCurrency, toCurrency]);

  const applyQuery = useCallback((from: string, to: string, value: string) => {
    setFromCurrency(from);
    setToCurrency(to);
    setAmount(value);
  }, []);

  // Anything that changes the pair from outside the input clears the typed query, so
  // the input never contradicts what's shown under it.
  const select = useCallback((from: string, to: string, value?: string) => {
    setFromCurrency(from);
    setToCurrency(to);
    if (value) setAmount(value);
    setQuery('');
    // On desktop the converter is pinned and always in view; on phones, bring it back
    if (!window.matchMedia(SPLIT_LAYOUT).matches) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, []);

  const swap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setQuery('');
  }, [fromCurrency, toCurrency]);

  const recentCodes = useMemo(() => {
    const seen = new Set<string>();
    for (const { from, to } of history) {
      seen.add(from);
      seen.add(to);
    }
    return [...seen].slice(0, 6);
  }, [history]);

  const numAmount = parseFloat(amount) || 1;
  const globeBase = hasHistory(localCurrency) ? localCurrency : 'USD';
  const onPagePair = fromCurrency === initialFrom && toCurrency === initialTo;
  // Pair pages are about one pair; once you've moved off it, say what's on screen
  const title = details && !onPagePair ? `${fromCurrency} to ${toCurrency} exchange rate` : heading;
  // The big figure already shows the target, so don't list it again
  const compareTargets = multiTargets.filter((t) => t !== toCurrency);

  return (
    // Phones: one column. Desktop: the converter pinned in the left half, context
    // scrolling in the right, so the answer never leaves the screen.
    <div className="mx-auto max-w-2xl px-5 pb-24 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-20 lg:px-10 xl:gap-x-28">
      <div className="no-scrollbar pt-28 sm:pt-36 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center-safe lg:overflow-x-hidden lg:overflow-y-auto lg:pt-16 lg:pb-10">
        <h1 className="mb-10 t-label text-ink-3">{title}</h1>

        <Converter
          query={query}
          onQueryChange={setQuery}
          amount={amount}
          from={fromCurrency}
          to={toCurrency}
          localCurrency={localCurrency}
          seedRates={seedRates}
          onApply={applyQuery}
          onPick={setPicking}
          onSwap={swap}
          trailing={
            <PriceScanner
              from={fromCurrency}
              to={toCurrency}
              localCurrency={localCurrency}
              onApply={select}
            />
          }
        />
      </div>

      <CurrencyPicker
        open={picking !== null}
        title={picking === 'from' ? 'Convert from' : 'Convert to'}
        value={picking === 'from' ? fromCurrency : toCurrency}
        recent={recentCodes}
        onSelect={(code) =>
          picking === 'from' ? select(code, toCurrency) : select(fromCurrency, code)
        }
        onClose={() => setPicking(null)}
      />

      <div className="lg:pt-32">
        <Block
          id="compare"
          title={`${numAmount.toLocaleString('en-US')} ${fromCurrency} elsewhere`}
        >
          <MultiCurrencyResults
            fromCurrency={fromCurrency}
            amount={amount}
            targets={compareTargets}
            onSelect={(from, to) => select(from, to)}
          />
        </Block>

        {pairHasHistory(fromCurrency, toCurrency) && (
          <>
            <Block id="trend" title={`${fromCurrency} to ${toCurrency} over time`}>
              <RateTrendChart fromCurrency={fromCurrency} toCurrency={toCurrency} />
            </Block>
            <Block id="then-and-now" title="Then and now">
              <TimeMachine fromCurrency={fromCurrency} toCurrency={toCurrency} amount={amount} />
            </Block>
          </>
        )}

        <Block id="globe" title={`Where ${getCurrency(globeBase)?.name ?? globeBase} goes further`}>
          <CurrencyGlobe base={globeBase} onSelect={(from, to) => select(from, to)} />
        </Block>

        {details &&
          (onPagePair ? (
            <Block id="details" title={`${initialFrom} to ${initialTo} in detail`}>
              {details}
            </Block>
          ) : (
            <p className="mt-24 t-label text-ink-3">
              {/* Details are server-rendered for the page's own pair, so link to the new one */}
              <a
                href={pairPath(fromCurrency, toCurrency)}
                className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                Rates, tables and history for {fromCurrency} to {toCurrency}
              </a>
            </p>
          ))}
      </div>
    </div>
  );
}

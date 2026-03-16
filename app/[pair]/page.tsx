import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConverterSection from '@/components/ConverterSection';
import { getCurrency } from '@/lib/currencies';

interface Props {
  params: Promise<{ pair: string }>;
}

function parsePair(slug: string): { from: string; to: string } | null {
  const match = slug.match(/^([a-z]{3})-to-([a-z]{3})$/);
  if (!match) return null;
  const from = match[1].toUpperCase();
  const to = match[2].toUpperCase();
  if (!getCurrency(from) || !getCurrency(to)) return null;
  return { from, to };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) return {};

  const fromCurrency = getCurrency(parsed.from);
  const toCurrency = getCurrency(parsed.to);

  return {
    title: `${parsed.from} to ${parsed.to} Live Exchange Rate`,
    description: `Convert ${fromCurrency?.name} (${parsed.from}) to ${toCurrency?.name} (${parsed.to}) instantly. Live exchange rates updated in real time. Free currency conversion tool.`,
    alternates: { canonical: `/${pair}` },
    keywords: [
      `${parsed.from} to ${parsed.to}`,
      `${parsed.from} ${parsed.to} exchange rate`,
      `convert ${parsed.from} to ${parsed.to}`,
      `${fromCurrency?.name} to ${toCurrency?.name}`,
    ],
  };
}

export function generateStaticParams() {
  const pairs = [
    { from: 'usd', to: 'myr' },
    { from: 'myr', to: 'usd' },
    { from: 'eur', to: 'usd' },
    { from: 'usd', to: 'eur' },
    { from: 'gbp', to: 'usd' },
    { from: 'usd', to: 'gbp' },
    { from: 'usd', to: 'jpy' },
    { from: 'usd', to: 'sgd' },
    { from: 'sgd', to: 'myr' },
    { from: 'eur', to: 'gbp' },
    { from: 'aud', to: 'usd' },
    { from: 'usd', to: 'cad' },
  ];
  return pairs.map(({ from, to }) => ({ pair: `${from}-to-${to}` }));
}

export default async function PairPage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  const fromCurrency = getCurrency(parsed.from);
  const toCurrency = getCurrency(parsed.to);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* SEO header — dark themed */}
      <div className="mb-8 p-6 bg-slate-900 rounded-2xl border border-slate-800">
        <h1 className="text-xl font-bold text-slate-50 mb-2">
          {fromCurrency?.flag} {parsed.from} to {toCurrency?.flag} {parsed.to} — Live Exchange Rate
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Convert{' '}
          <span className="text-slate-200 font-medium">
            {fromCurrency?.name} ({parsed.from})
          </span>{' '}
          to{' '}
          <span className="text-slate-200 font-medium">
            {toCurrency?.name} ({parsed.to})
          </span>{' '}
          instantly using live exchange rates. Powered by mid-market data — updated every minute.
        </p>
      </div>

      <ConverterSection initialFrom={parsed.from} initialTo={parsed.to} />
    </main>
  );
}

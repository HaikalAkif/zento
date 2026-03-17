import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConverterSection from '@/components/ConverterSection';
import { getCurrency } from '@/lib/currencies';

interface Props {
  params: Promise<{ pair: string }>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zento.haikalakif.com';

// Top currency pairs by global search volume — used for static pre-rendering and sitemap
export const STATIC_PAIRS = [
  // USD majors
  'usd-to-eur', 'eur-to-usd',
  'usd-to-gbp', 'gbp-to-usd',
  'usd-to-jpy', 'jpy-to-usd',
  'usd-to-cad', 'cad-to-usd',
  'usd-to-aud', 'aud-to-usd',
  'usd-to-chf', 'chf-to-usd',
  'usd-to-cny', 'cny-to-usd',
  'usd-to-inr', 'inr-to-usd',
  'usd-to-myr', 'myr-to-usd',
  'usd-to-sgd', 'sgd-to-usd',
  'usd-to-hkd', 'hkd-to-usd',
  'usd-to-nzd', 'nzd-to-usd',
  'usd-to-aed', 'aed-to-usd',
  // Regional popular
  'eur-to-gbp', 'gbp-to-eur',
  'eur-to-jpy', 'jpy-to-eur',
  'eur-to-inr', 'inr-to-eur',
  'gbp-to-inr', 'inr-to-gbp',
  'sgd-to-myr', 'myr-to-sgd',
  'jpy-to-myr', 'myr-to-jpy',
  'aud-to-nzd', 'nzd-to-aud',
  'aud-to-sgd', 'sgd-to-aud',
] as const;

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

  const from = getCurrency(parsed.from);
  const to = getCurrency(parsed.to);
  const title = `${parsed.from} to ${parsed.to} — Live Exchange Rate`;
  const description = `Convert ${from?.name} (${parsed.from}) to ${to?.name} (${parsed.to}) instantly. Live mid-market exchange rates updated in real time. Free currency conversion — no sign-up required.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    keywords: [
      `${parsed.from} to ${parsed.to}`,
      `${parsed.from} ${parsed.to} exchange rate`,
      `convert ${parsed.from} to ${parsed.to}`,
      `${from?.name} to ${to?.name}`,
      `${parsed.from} ${parsed.to} rate today`,
    ],
    alternates: { canonical: `/${pair}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${APP_URL}/${pair}`,
      siteName: 'Zento',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  };
}

export function generateStaticParams() {
  return STATIC_PAIRS.map((pair) => {
    const [from, , to] = pair.split('-');
    return { pair: `${from}-to-${to}` };
  });
}

export default async function PairPage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  const from = getCurrency(parsed.from);
  const to = getCurrency(parsed.to);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${parsed.from} to ${parsed.to}`,
        item: `${APP_URL}/${pair}`,
      },
    ],
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* SEO header */}
      <div className="mb-8 p-6 bg-slate-900 rounded-2xl border border-slate-800">
        <h1 className="text-xl font-bold text-slate-50 mb-2">
          {from?.flag} {parsed.from} to {to?.flag} {parsed.to} — Live Exchange Rate
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Convert{' '}
          <span className="text-slate-200 font-medium">
            {from?.name} ({parsed.from})
          </span>{' '}
          to{' '}
          <span className="text-slate-200 font-medium">
            {to?.name} ({parsed.to})
          </span>{' '}
          instantly using live exchange rates. Powered by mid-market data — updated every minute.
        </p>
      </div>

      <ConverterSection initialFrom={parsed.from} initialTo={parsed.to} />
    </main>
  );
}

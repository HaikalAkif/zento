import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ConverterSection from '@/components/ConverterSection';
import { getCurrency } from '@/lib/currencies';
import { APP_URL, STATIC_PAIRS } from '@/lib/config';

interface Props {
  params: Promise<{ pair: string }>;
  searchParams: Promise<{ amount?: string }>;
}

function parseAmount(raw: string | undefined): string {
  if (!raw) return '1';
  const n = parseFloat(raw);
  return !isNaN(n) && n > 0 ? raw : '1';
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
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@zentoapp',
    },
  };
}

export function generateStaticParams() {
  return STATIC_PAIRS.map((pair) => {
    const [from, , to] = pair.split('-');
    return { pair: `${from}-to-${to}` };
  });
}

function getRelatedPairs(from: string, to: string): string[] {
  return STATIC_PAIRS.filter((p) => {
    const [f, , t] = p.split('-');
    const pFrom = f.toUpperCase();
    const pTo = t.toUpperCase();
    if (pFrom === from && pTo === to) return false;
    return pFrom === from || pTo === to || pFrom === to || pTo === from;
  }).slice(0, 5);
}

export default async function PairPage({ params, searchParams }: Props) {
  const [{ pair }, { amount: amountParam }] = await Promise.all([params, searchParams]);
  const initialAmount = parseAmount(amountParam);
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  const from = getCurrency(parsed.from);
  const to = getCurrency(parsed.to);

  const pageUrl = `${APP_URL}/${pair}`;

  const now = new Date().toISOString();
  const relatedPairs = getRelatedPairs(parsed.from, parsed.to);

  const faqItems = [
    {
      q: `What is the ${parsed.from} to ${parsed.to} exchange rate today?`,
      a: `The live ${parsed.from} to ${parsed.to} mid-market exchange rate is shown above, sourced from ExchangeRate-API and updated every minute. Historical rate trends (3 days to 1 year) use European Central Bank (ECB) reference data via Frankfurter.`,
    },
    {
      q: `How do I convert ${from?.name ?? parsed.from} to ${to?.name ?? parsed.to}?`,
      a: `Enter any amount in the converter above and select ${parsed.from} as source and ${parsed.to} as target. The result updates instantly. You can also use the slider to quickly select common amounts between 10 and 10,000.`,
    },
    {
      q: `How often does the ${parsed.from}/${parsed.to} rate update?`,
      a: `Live rates refresh every minute from ExchangeRate-API (166+ currencies). Historical chart data is sourced from the European Central Bank and updates on each business day.`,
    },
    {
      q: `Is the ${parsed.from} to ${parsed.to} converter free?`,
      a: `Yes. Zento is entirely free — no sign-up, no ads, no fees. It uses open, publicly available exchange rate data from ExchangeRate-API and the European Central Bank.`,
    },
    {
      q: `What is the mid-market rate for ${parsed.from} to ${parsed.to}?`,
      a: `The mid-market rate (also called the interbank rate) is the midpoint between the buy and sell prices in global currency markets. It is the most transparent reference rate and is used by Zento for all conversions. Note that banks and money transfer services typically add a margin above this rate.`,
    },
  ];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: `${parsed.from} to ${parsed.to} Exchange Rate`,
          item: pageUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to convert ${from?.name ?? parsed.from} to ${to?.name ?? parsed.to}`,
      description: `Step-by-step guide to convert ${parsed.from} to ${parsed.to} using Zento's free currency converter.`,
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Enter an amount',
          text: `Type any amount into the input field or drag the slider to select a value between 10 and 10,000 ${parsed.from}.`,
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Confirm currency pair',
          text: `Verify ${parsed.from} (${from?.name ?? parsed.from}) is selected as the source and ${parsed.to} (${to?.name ?? parsed.to}) as the target. Use the swap button to reverse the direction.`,
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Read the converted result',
          text: `The converted amount in ${to?.name ?? parsed.to} (${parsed.to}) appears instantly below. The live mid-market rate and last update time are shown in the rate badge.`,
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Check the rate trend',
          text: `Scroll down to the rate trend chart to see how the ${parsed.from}/${parsed.to} exchange rate has moved over the past 3 days, 7 days, 30 days, or 1 year.`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FinancialService',
      name: `${parsed.from} to ${parsed.to} Currency Converter`,
      url: pageUrl,
      dateModified: now,
      description: `Convert ${from?.name ?? parsed.from} (${parsed.from}) to ${to?.name ?? parsed.to} (${parsed.to}) using live mid-market exchange rates.`,
      serviceType: 'Currency Conversion',
      areaServed: 'Worldwide',
      provider: {
        '@type': 'Organization',
        name: 'Zento',
        url: APP_URL,
      },
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* SEO header */}
      <div className="mb-8 p-6 bg-slate-900 rounded-2xl border border-slate-800">
        <h1 className="text-xl font-bold text-slate-50 mb-2">
          {from?.flag} {parsed.from} to {to?.flag} {parsed.to} — Live Exchange Rate
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          Convert{' '}
          <strong className="text-slate-200 font-medium">
            {from?.name} ({parsed.from})
          </strong>{' '}
          to{' '}
          <strong className="text-slate-200 font-medium">
            {to?.name} ({parsed.to})
          </strong>{' '}
          instantly. Live mid-market rate — updated every minute. No sign-up required.
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/60 rounded-lg px-3 py-2">
            <dt className="text-slate-500 mb-0.5">Data source</dt>
            <dd className="text-slate-300 font-medium">ExchangeRate-API + ECB</dd>
          </div>
          <div className="bg-slate-800/60 rounded-lg px-3 py-2">
            <dt className="text-slate-500 mb-0.5">Rate type</dt>
            <dd className="text-slate-300 font-medium">Mid-market</dd>
          </div>
          <div className="bg-slate-800/60 rounded-lg px-3 py-2">
            <dt className="text-slate-500 mb-0.5">Update frequency</dt>
            <dd className="text-slate-300 font-medium">Every minute</dd>
          </div>
          <div className="bg-slate-800/60 rounded-lg px-3 py-2">
            <dt className="text-slate-500 mb-0.5">Cost</dt>
            <dd className="text-slate-300 font-medium">Free</dd>
          </div>
        </dl>
      </div>

      <ConverterSection initialFrom={parsed.from} initialTo={parsed.to} initialAmount={initialAmount} />

      {/* Visible FAQ — content must match FAQPage schema for AEO */}
      <section className="mt-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
        <h2 className="text-base font-bold text-slate-50 mb-5">
          Frequently Asked Questions — {parsed.from} to {parsed.to}
        </h2>
        <div className="space-y-0 divide-y divide-slate-800">
          {faqItems.map(({ q, a }) => (
            <details key={q} className="group py-4 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer items-start justify-between gap-4 list-none text-sm font-semibold text-slate-200 hover:text-slate-50 transition-colors">
                <span>{q}</span>
                <span aria-hidden="true" className="shrink-0 text-slate-600 group-open:rotate-180 transition-transform duration-200 mt-0.5">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related pairs — internal linking for SEO crawl depth */}
      {relatedPairs.length > 0 && (
        <section className="mt-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
          <h2 className="text-base font-bold text-slate-50 mb-4">Related Currency Pairs</h2>
          <div className="flex flex-wrap gap-2">
            {relatedPairs.map((p) => {
              const [f, , t] = p.split('-');
              const fCur = getCurrency(f.toUpperCase());
              const tCur = getCurrency(t.toUpperCase());
              return (
                <Link
                  key={p}
                  href={`/${p}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-50 transition-all"
                >
                  {fCur?.flag} {f.toUpperCase()} → {tCur?.flag} {t.toUpperCase()}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

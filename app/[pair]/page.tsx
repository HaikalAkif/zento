import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConverterSection from '@/components/ConverterSection';
import PairInsights from '@/components/PairInsights';
import { getCurrency } from '@/lib/currencies';
import { APP_URL, STATIC_PAIRS } from '@/lib/config';
import { getPairSnapshot } from '@/lib/rates';
import { detectLocalCurrency } from '@/lib/region-server';
import { formatAmount, formatDate, formatRate } from '@/lib/format';

// Rendered per request rather than prerendered: the page states the live rate in its
// HTML, and a build-time snapshot would go stale. Upstream data is cached in lib/rates.

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
  // Throwing here, not just in the page: Next resolves metadata before streaming for
  // crawlers, so this is what gives bots a real 404 instead of a soft-404 200.
  if (!parsed) notFound();

  const from = getCurrency(parsed.from);
  const to = getCurrency(parsed.to);
  const title = `${parsed.from} to ${parsed.to}: Live Exchange Rate`;
  const snapshot = await getPairSnapshot(parsed.from, parsed.to);
  // Lead with the number: it's what the searcher wants, and it lifts click-through.
  const ratePrefix = snapshot
    ? `1 ${parsed.from} = ${formatRate(snapshot.rate)} ${parsed.to} today. `
    : '';
  const description = `${ratePrefix}Convert ${from?.name} (${parsed.from}) to ${to?.name} (${parsed.to}) at the live mid-market rate, with conversion tables and rate history. Free, no sign-up.`;

  return {
    title,
    description,
    // Only the curated pairs are indexable. The full currency list would otherwise expose
    // tens of thousands of near-identical URLs and dilute crawl budget.
    robots: STATIC_PAIRS.includes(pair as (typeof STATIC_PAIRS)[number])
      ? { index: true, follow: true }
      : { index: false, follow: true },
    keywords: [
      `${parsed.from} to ${parsed.to}`,
      `${parsed.from} ${parsed.to} exchange rate`,
      `convert ${parsed.from} to ${parsed.to}`,
      `${from?.name} to ${to?.name}`,
      `${parsed.from} ${parsed.to} rate today`,
    ],
    alternates: { canonical: `${APP_URL}/${pair}` },
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
    },
  };
}

export default async function PairPage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  const from = getCurrency(parsed.from);
  const to = getCurrency(parsed.to);
  const [snapshot, localCurrency] = await Promise.all([
    getPairSnapshot(parsed.from, parsed.to),
    detectLocalCurrency(),
  ]);
  const seedRates = snapshot && {
    amount: 1,
    base: parsed.from,
    date: snapshot.date,
    rates: { [parsed.to]: snapshot.rate },
  };

  const pageUrl = `${APP_URL}/${pair}`;

  const fromName = from?.name ?? parsed.from;
  const toName = to?.name ?? parsed.to;
  // Answers state the actual numbers when we have them. The FAQPage schema below is
  // built from the same array, so visible text and structured data always agree.
  const faqItems = [
    {
      q: `What is the ${parsed.from} to ${parsed.to} exchange rate today?`,
      a: snapshot
        ? `As of ${formatDate(snapshot.date)}, 1 ${parsed.from} = ${formatRate(snapshot.rate)} ${parsed.to} and 1 ${parsed.to} = ${formatRate(snapshot.inverse)} ${parsed.from} at the mid-market rate, sourced from ExchangeRate-API and refreshed every minute on this page.`
        : `The live ${parsed.from} to ${parsed.to} mid-market exchange rate is shown above, sourced from ExchangeRate-API and updated every minute. Historical rate trends (3 days to 1 year) use European Central Bank (ECB) reference data via Frankfurter.`,
    },
    ...(snapshot
      ? [
          {
            q: `How much is 100 ${parsed.from} in ${parsed.to}?`,
            a: `100 ${fromName} is ${formatAmount(100 * snapshot.rate)} ${toName} at today's mid-market rate. 1,000 ${parsed.from} is ${formatAmount(1000 * snapshot.rate)} ${parsed.to}. Banks and card providers usually add a margin, so expect to receive slightly less.`,
          },
        ]
      : []),
    ...(snapshot?.month
      ? [
          {
            q: `Is ${parsed.from} going up or down against ${parsed.to}?`,
            a: `Over the past 30 days ${parsed.from}/${parsed.to} moved ${snapshot.month.changePct > 0 ? '+' : ''}${snapshot.month.changePct.toFixed(2)}%, trading between ${formatRate(snapshot.month.low)} and ${formatRate(snapshot.month.high)}.${snapshot.year ? ` Its 1-year range is ${formatRate(snapshot.year.low)} to ${formatRate(snapshot.year.high)}.` : ''} Past movement does not predict future rates.`,
          },
        ]
      : []),
    {
      q: `How do I convert ${from?.name ?? parsed.from} to ${to?.name ?? parsed.to}?`,
      a: `Enter any amount in the converter above and select ${parsed.from} as source and ${parsed.to} as target. The result updates instantly. You can also use the slider to quickly select common amounts between 10 and 10,000.`,
    },
    {
      q: `How often does the ${parsed.from}/${parsed.to} rate update?`,
      a: `Live rates refresh every minute from ExchangeRate-API. Historical chart data is sourced from the European Central Bank and updates on each business day.`,
    },
    {
      q: `Is the ${parsed.from} to ${parsed.to} converter free?`,
      a: `Yes. Zento is entirely free. No sign-up, no ads, no fees. It uses open, publicly available exchange rate data from ExchangeRate-API and the European Central Bank.`,
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
      // The rate's publication date. Omitted when rates are unavailable.
      ...(snapshot && { dateModified: snapshot.date }),
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

  const heroContent = (
    <>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-slate-50 sm:text-4xl">
        {from?.flag} {parsed.from} to {to?.flag} {parsed.to}
        <span className="mt-1 block text-sm font-semibold tracking-normal text-blue-400/80 sm:text-xl">
          Live Exchange Rate
        </span>
      </h1>
      <p className="mt-2 text-sm text-slate-400 sm:text-base">
        {snapshot
          ? `1 ${parsed.from} = ${formatRate(snapshot.rate)} ${parsed.to} · mid-market, updates every 60 seconds`
          : 'Real-time mid-market rate. Updates every 60 seconds.'}
      </p>
    </>
  );

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <ConverterSection
        initialFrom={parsed.from}
        initialTo={parsed.to}
        heroContent={heroContent}
        localCurrency={localCurrency}
        seedRates={seedRates}
      />

      <div className="mx-auto max-w-5xl space-y-5 px-4 pb-10 sm:px-6">
        {snapshot && <PairInsights snapshot={snapshot} />}

        {/* Visible FAQ: content must match FAQPage schema for AEO */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7">
          <h2 className="mb-5 text-base font-bold text-slate-50">
            {parsed.from} to {parsed.to}: FAQ
          </h2>
          <div className="space-y-0 divide-y divide-slate-800">
            {faqItems.map(({ q, a }) => (
              <details key={q} className="group py-4 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-slate-200 transition-colors hover:text-slate-50">
                  <span>{q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-slate-600 transition-transform duration-200 group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

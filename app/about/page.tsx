import type { Metadata } from 'next';
import Link from 'next/link';
import { CURRENCIES, hasHistory } from '@/lib/currencies';
import { APP_URL, STATIC_PAIRS } from '@/lib/config';

const HISTORY_COUNT = CURRENCIES.filter((c) => hasHistory(c.code)).length;

export const metadata: Metadata = {
  // `absolute` skips the "| Zento" template, which would render "About Zento | Zento"
  title: { absolute: 'About Zento: Free Currency Converter' },
  description: `What Zento is, who builds it, and where its exchange rates come from. A free currency converter covering ${CURRENCIES.length} currencies with live mid-market rates.`,
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'About Zento',
    description: `What Zento is, who builds it, and where its exchange rates come from.`,
    type: 'website',
    url: `${APP_URL}/about`,
    siteName: 'Zento',
    locale: 'en_US',
  },
};

const brandFaq = [
  {
    q: 'What is Zento?',
    a: `Zento is a free currency converter that shows live mid-market exchange rates for ${CURRENCIES.length} world currencies. There is no sign-up, no account, and no fee. Enter an amount, pick two currencies, and the converted figure appears immediately.`,
  },
  {
    q: 'Who makes Zento?',
    a: 'Zento is built and maintained by iCool, an independent developer. It is a personal project rather than a company product, and its source is public on GitHub.',
  },
  {
    q: 'Is Zento free?',
    a: 'Yes, entirely. No account, no ads, no paid tier, no limit on conversions. Zento does not handle money and never asks for payment details.',
  },
  {
    q: 'Where does Zento get its exchange rates?',
    a: `Live rates come from ExchangeRate-API. Historical rate charts use European Central Bank reference data via the Frankfurter API, which publishes ${HISTORY_COUNT} of the currencies Zento supports. All figures are mid-market rates.`,
  },
  {
    q: 'Does Zento exchange money?',
    a: 'No. Zento is a reference tool only. It shows what a conversion is worth at the mid-market rate. It does not transfer, hold, or exchange funds, and the rate you get from a bank or transfer service will include a margin on top.',
  },
];

export default function AboutPage() {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${APP_URL}/about#page`,
      name: 'About Zento',
      url: `${APP_URL}/about`,
      mainEntity: { '@id': `${APP_URL}/#organization` },
      isPartOf: { '@id': `${APP_URL}/#website` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: brandFaq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'About', item: `${APP_URL}/about` },
      ],
    },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 tracking-tight">About Zento</h1>
      <p className="mt-4 text-base text-slate-300 leading-relaxed">
        Zento is a free currency converter. It shows live mid-market exchange rates for{' '}
        {CURRENCIES.length} world currencies, with no sign-up, no ads, and no fees.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-50">Why it exists</h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          Most currency converters bury the number you came for under ads, cookie walls, and
          upsells to a transfer service. Zento does one thing: it converts, fast, and gets out
          of the way. The mid-market rate it shows is the honest reference rate, the midpoint
          between the buy and sell prices in global currency markets, not a marked-up rate
          quoted to sell you something.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-50">Where the rates come from</h2>
        <dl className="mt-3 divide-y divide-slate-800 border-y border-slate-800">
          <div className="flex flex-col sm:flex-row sm:gap-6 py-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-44 shrink-0">
              Live rates
            </dt>
            <dd className="text-sm text-slate-300 mt-1 sm:mt-0">
              ExchangeRate-API, refreshed every 60 seconds
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6 py-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-44 shrink-0">
              Historical charts
            </dt>
            <dd className="text-sm text-slate-300 mt-1 sm:mt-0">
              European Central Bank via Frankfurter. {HISTORY_COUNT} currencies, updated each business day
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6 py-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-44 shrink-0">
              Rate type
            </dt>
            <dd className="text-sm text-slate-300 mt-1 sm:mt-0">Mid-market (interbank) only</dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6 py-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-44 shrink-0">
              Cost
            </dt>
            <dd className="text-sm text-slate-300 mt-1 sm:mt-0">Free, no account required</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
          Zento is a reference tool, not a financial service. It does not transfer or exchange
          money, and the rate a bank or transfer service gives you will include a margin above
          the mid-market rate shown here. Not financial advice.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-50">Common questions</h2>
        <div className="mt-3 divide-y divide-slate-800">
          {brandFaq.map(({ q, a }) => (
            <div key={q} className="py-4 first:pt-0">
              <h3 className="text-sm font-semibold text-slate-200">{q}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-50">Popular conversions</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {STATIC_PAIRS.slice(0, 12).map((pair) => {
            const [from, , to] = pair.split('-');
            return (
              <li key={pair}>
                <Link
                  href={`/${pair}`}
                  className="inline-block px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/60 rounded-full hover:bg-slate-800 hover:text-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {from.toUpperCase()} → {to.toUpperCase()}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Open the converter
        </Link>
      </div>
    </main>
  );
}

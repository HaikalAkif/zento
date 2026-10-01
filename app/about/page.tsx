import type { Metadata } from 'next';
import Link from 'next/link';
import { CURRENCIES, hasHistory } from '@/lib/currencies';
import { APP_URL, STATIC_PAIRS } from '@/lib/config';

const HISTORY_COUNT = CURRENCIES.filter((c) => hasHistory(c.code)).length;

export const metadata: Metadata = {
  // `absolute` skips the "| Zento" template, which would render "About Zento | Zento"
  title: { absolute: 'About Zento: a free currency converter you type into' },
  description: `What Zento is, what it can do, where its exchange rates come from and what it stores. A free currency converter for ${CURRENCIES.length} currencies at the live mid-market rate.`,
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
    a: `Zento is a free currency converter for ${CURRENCIES.length} currencies at the live mid-market rate. You type what you want to convert, like 150 euro in yen, and the answer appears as you type. There is no sign-up, no account and no fee.`,
  },
  {
    q: 'Who makes Zento?',
    a: 'Zento is built and maintained by iCool, an independent developer. It is a personal project rather than a company product, and its source code is public on GitHub.',
  },
  {
    q: 'Is Zento free?',
    a: 'Yes, entirely. No account, no ads, no paid tier and no limit on conversions. Zento never handles money and never asks for payment details.',
  },
  {
    q: 'Where do the rates come from, and how fresh are they?',
    a: `Live rates come from ExchangeRate-API, which publishes once a day; Zento caches them for up to an hour and the page checks for new ones every minute. Charts, the then-and-now comparison and 30-day ranges use European Central Bank reference rates via Frankfurter, which cover ${HISTORY_COUNT} of the currencies Zento supports and update each business day. All figures are mid-market rates.`,
  },
  {
    q: 'Does Zento exchange money?',
    a: 'No. Zento is a reference tool. It shows what a conversion is worth at the mid-market rate; it does not transfer, hold or exchange money, and a bank or transfer service will add a margin on top of the rate you see here.',
  },
  {
    q: 'What does Zento store about me?',
    a: "No account and no tracking. Zento sets one cookie to remember the last pair you used, and your browser keeps a short list of recent pairs locally. Photos you scan are read and discarded, never stored. If you set a rate alert, Zento keeps the alert and your browser's push address until the alert fires or you delete it.",
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
    <main className="mx-auto max-w-2xl px-5 pt-28 pb-16 sm:px-6 sm:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1 className="t-label text-ink-3">About Zento</h1>
      <p className="mt-2 text-3xl font-medium tracking-tight text-ink">
        Type an amount. Get the answer.
      </p>
      <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
        Zento is a free currency converter for {CURRENCIES.length} currencies. Instead of dropdowns
        and buttons, there is one box: type 150 euro in yen, ¥30k to sgd or hotel ¥45,000 split 3
        ways and the answer appears as you type. It shows the mid-market rate, the honest midpoint
        between buy and sell prices, not a marked-up rate quoted to sell you something.
      </p>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">What it does</h2>
        <ul className="space-y-3 text-[15px] leading-relaxed text-ink-2">
          <li>
            <span className="text-ink">Converts as you type</span> in plain language: amounts,
            currency names, codes, symbols and even country names.{' '}
            <Link
              href="/guide"
              className="text-ink underline decoration-line-strong underline-offset-4 hover:text-accent"
            >
              See everything it understands
            </Link>
            .
          </li>
          <li>
            <span className="text-ink">Shows the bigger picture</span>: what your amount is worth in
            other currencies, how the rate has moved, what it bought years ago, and where your money
            goes further than a year ago.
          </li>
          <li>
            <span className="text-ink">Reads prices from a photo</span> of a menu, price tag or
            receipt and converts every one.
          </li>
          <li>
            <span className="text-ink">Tells you when a rate moves</span> past a number you pick,
            with a notification and no account.
          </li>
          <li>
            <span className="text-ink">Works with AI assistants</span> through a Model Context
            Protocol server, so they can look up live rates directly.
          </li>
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">Where the rates come from</h2>
        <dl className="space-y-4 text-[15px]">
          {[
            ['Live rates', 'ExchangeRate-API, published daily and cached for up to an hour'],
            [
              'History',
              `European Central Bank reference rates via Frankfurter: ${HISTORY_COUNT} currencies, each business day, back to 1999`,
            ],
            ['Rate type', 'Mid-market only'],
            ['Cost', 'Free, no account'],
          ].map(([term, detail]) => (
            <div key={term} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <dt className="t-label text-ink-3">{term}</dt>
              <dd className="text-ink-2">{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 t-label text-ink-3">
          Zento is a reference tool, not a financial service, and nothing here is financial advice.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="mb-2 t-h2 text-ink">Questions</h2>
        <div className="divide-y divide-line">
          {brandFaq.map(({ q, a }) => (
            <div key={q} className="py-5">
              <h3 className="text-[15px] text-ink">{q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">Popular conversions</h2>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          {STATIC_PAIRS.slice(0, 18).map((pair) => {
            const [from, , to] = pair.split('-');
            return (
              <li key={pair}>
                <Link href={`/${pair}`} className="text-ink-2 transition-colors hover:text-ink">
                  {from.toUpperCase()} to {to.toUpperCase()}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-14 flex gap-6 text-[15px]">
        <Link href="/" className="text-accent hover:opacity-80">
          Open the converter
        </Link>
        <Link href="/guide" className="text-ink-2 hover:text-ink">
          Read the guide
        </Link>
      </p>
    </main>
  );
}

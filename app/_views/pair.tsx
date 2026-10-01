// A currency pair page (/usd-to-myr, /ms/usd-to-myr). Rendered per request rather than
// prerendered: the page states the live rate in its HTML, and a build-time snapshot
// would go stale. Upstream data is cached in lib/rates.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ConverterSection from '@/components/ConverterSection';
import PairInsights from '@/components/PairInsights';
import { getCurrency } from '@/lib/currencies';
import { isIndexablePair, relatedPairs } from '@/lib/seo';
import { getPairSnapshot, type PairSnapshot } from '@/lib/rates';
import { detectLocalCurrency } from '@/lib/region-server';
import { defaultAmount, formatAmount, formatDate, formatRate } from '@/lib/format';
import { currencyName, localePath, type Lang } from '@/lib/i18n';
import { currencyPath, pairPath } from '@/lib/paths';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  Faq,
  faqJsonLd,
  JsonLd,
  pageMetadata,
  type FaqItem,
} from './shared';

export function parsePairSlug(slug: string): { from: string; to: string } | null {
  const match = slug.match(/^([a-z]{3})-to-([a-z]{3})$/);
  if (!match) return null;
  const from = match[1].toUpperCase();
  const to = match[2].toUpperCase();
  if (!getCurrency(from) || !getCurrency(to)) return null;
  return { from, to };
}

interface Names {
  from: string;
  to: string;
  fromName: string;
  toName: string;
}

const COPY = {
  en: {
    // Codes first for the searcher scanning results, full names for "us dollar to ringgit"
    title: (n: Names) => `${n.from} to ${n.to}: ${n.fromName} to ${n.toName} Exchange Rate`,
    description: (n: Names, s?: PairSnapshot) =>
      `${s ? `1 ${n.from} = ${formatRate(s.rate)} ${n.to} today. ` : ''}Convert ${n.fromName} (${n.from}) to ${n.toName} (${n.to}) at the live mid-market rate, with conversion tables and rate history. Free, no sign-up.`,
    keywords: (n: Names) => [
      `${n.from} to ${n.to}`,
      `${n.from} ${n.to} exchange rate`,
      `convert ${n.from} to ${n.to}`,
      `${n.fromName} to ${n.toName}`,
      `${n.from} ${n.to} rate today`,
    ],
    heading: (n: Names) => `${n.from} to ${n.to} exchange rate`,
    home: 'Home',
    questions: 'Questions',
    related: 'Related conversions',
    profiles: 'About these currencies',
    pairLink: (a: string, b: string) => `${a} to ${b}`,
    faq: (n: Names, s?: PairSnapshot): FaqItem[] => [
      {
        q: `What is the ${n.from} to ${n.to} exchange rate today?`,
        a: s
          ? `As of ${formatDate(s.date)}, 1 ${n.from} = ${formatRate(s.rate)} ${n.to} and 1 ${n.to} = ${formatRate(s.inverse)} ${n.from} at the mid-market rate, sourced from ExchangeRate-API and refreshed every minute on this page.`
          : `The live ${n.from} to ${n.to} mid-market exchange rate is shown above, sourced from ExchangeRate-API and updated every minute.`,
      },
      ...(s
        ? [
            {
              q: `How much is 100 ${n.from} in ${n.to}?`,
              a: `100 ${n.fromName} is ${formatAmount(100 * s.rate)} ${n.toName} at today's mid-market rate. 1,000 ${n.from} is ${formatAmount(1000 * s.rate)} ${n.to}. Banks and card providers usually add a margin, so expect to receive slightly less.`,
            },
          ]
        : []),
      ...(s?.month
        ? [
            {
              q: `Is ${n.from} going up or down against ${n.to}?`,
              a: `Over the past 30 days ${n.from}/${n.to} moved ${s.month.changePct > 0 ? '+' : ''}${s.month.changePct.toFixed(2)}%, trading between ${formatRate(s.month.low)} and ${formatRate(s.month.high)}.${s.year ? ` Its 1-year range is ${formatRate(s.year.low)} to ${formatRate(s.year.high)}.` : ''} Past movement does not predict future rates.`,
            },
          ]
        : []),
      ...(s?.past?.length
        ? [
            {
              q: `What was the ${n.from} to ${n.to} rate in the past?`,
              a: `${s.past
                .map(
                  (p) =>
                    `${p.years} ${p.years === 1 ? 'year' : 'years'} ago (${formatDate(p.date)}), 1 ${n.from} was ${formatRate(p.rate)} ${n.to}`,
                )
                .join(
                  '. ',
                )}. Today it is ${formatRate(s.rate)} ${n.to}. Figures are European Central Bank reference rates.`,
            },
          ]
        : []),
      {
        q: `How do I convert ${n.fromName} to ${n.toName}?`,
        a: `Type an amount in the box above, like 250 or 30k, and the ${n.to} value appears as you type. You can also type the whole question, like 100 ${n.from.toLowerCase()} in ${n.to.toLowerCase()}.`,
      },
      {
        q: `What is the mid-market rate for ${n.from} to ${n.to}?`,
        a: `The mid-market rate is the midpoint between the buy and sell prices in global currency markets. Zento uses it for every conversion. Banks and money transfer services typically add a margin on top of it.`,
      },
      {
        q: `Is the ${n.from} to ${n.to} converter free?`,
        a: `Yes. Zento is free, with no sign-up and no fees. It uses public exchange rate data from ExchangeRate-API and the European Central Bank.`,
      },
    ],
  },
  ms: {
    title: (n: Names) => `${n.from} ke ${n.to}: Kadar Pertukaran ${n.fromName} ke ${n.toName}`,
    description: (n: Names, s?: PairSnapshot) =>
      `${s ? `1 ${n.from} = ${formatRate(s.rate)} ${n.to} hari ini. ` : ''}Tukar ${n.fromName} (${n.from}) kepada ${n.toName} (${n.to}) pada kadar pasaran tengah semasa, dengan jadual penukaran dan sejarah kadar. Percuma, tanpa pendaftaran.`,
    keywords: (n: Names) => [
      `${n.from} ke ${n.to}`,
      `kadar pertukaran ${n.from} ${n.to}`,
      `tukar ${n.from} ke ${n.to}`,
      `${n.fromName} ke ${n.toName}`,
      `kadar ${n.from} ${n.to} hari ini`,
    ],
    heading: (n: Names) => `Kadar pertukaran ${n.from} ke ${n.to}`,
    home: 'Utama',
    questions: 'Soalan',
    related: 'Penukaran berkaitan',
    profiles: 'Tentang mata wang ini',
    pairLink: (a: string, b: string) => `${a} ke ${b}`,
    faq: (n: Names, s?: PairSnapshot): FaqItem[] => [
      {
        q: `Berapakah kadar pertukaran ${n.from} ke ${n.to} hari ini?`,
        a: s
          ? `Pada ${formatDate(s.date, 'ms')}, 1 ${n.from} = ${formatRate(s.rate)} ${n.to} dan 1 ${n.to} = ${formatRate(s.inverse)} ${n.from} pada kadar pasaran tengah, daripada ExchangeRate-API dan dikemas kini setiap minit di halaman ini.`
          : `Kadar pasaran tengah semasa ${n.from} ke ${n.to} dipaparkan di atas, daripada ExchangeRate-API dan dikemas kini setiap minit.`,
      },
      ...(s
        ? [
            {
              q: `Berapakah 100 ${n.from} dalam ${n.to}?`,
              a: `100 ${n.fromName} bersamaan ${formatAmount(100 * s.rate)} ${n.toName} pada kadar pasaran tengah hari ini. 1,000 ${n.from} bersamaan ${formatAmount(1000 * s.rate)} ${n.to}. Bank dan penyedia kad biasanya mengenakan margin, jadi jangkakan jumlah yang diterima sedikit kurang.`,
            },
          ]
        : []),
      ...(s?.month
        ? [
            {
              q: `Adakah ${n.from} naik atau turun berbanding ${n.to}?`,
              a: `Dalam 30 hari lalu ${n.from}/${n.to} berubah ${s.month.changePct > 0 ? '+' : ''}${s.month.changePct.toFixed(2)}%, diniagakan antara ${formatRate(s.month.low)} dan ${formatRate(s.month.high)}.${s.year ? ` Julat 1 tahunnya ialah ${formatRate(s.year.low)} hingga ${formatRate(s.year.high)}.` : ''} Pergerakan lalu tidak meramalkan kadar akan datang.`,
            },
          ]
        : []),
      ...(s?.past?.length
        ? [
            {
              q: `Berapakah kadar ${n.from} ke ${n.to} pada masa lalu?`,
              a: `${s.past
                .map(
                  (p) =>
                    `${p.years} tahun lalu (${formatDate(p.date, 'ms')}), 1 ${n.from} bernilai ${formatRate(p.rate)} ${n.to}`,
                )
                .join(
                  '. ',
                )}. Hari ini nilainya ${formatRate(s.rate)} ${n.to}. Angka ini ialah kadar rujukan Bank Pusat Eropah.`,
            },
          ]
        : []),
      {
        q: `Bagaimanakah cara menukar ${n.fromName} kepada ${n.toName}?`,
        a: `Taip jumlah dalam kotak di atas, contohnya 250 atau 30k, dan nilai dalam ${n.to} akan muncul semasa anda menaip. Anda juga boleh menaip soalan penuh, contohnya 100 ${n.from.toLowerCase()} ke ${n.to.toLowerCase()}.`,
      },
      {
        q: `Apakah kadar pasaran tengah untuk ${n.from} ke ${n.to}?`,
        a: `Kadar pasaran tengah ialah titik tengah antara harga beli dan jual dalam pasaran mata wang global. Zento menggunakannya untuk setiap penukaran. Bank dan perkhidmatan pemindahan wang biasanya menambah margin di atasnya.`,
      },
      {
        q: `Adakah penukar ${n.from} ke ${n.to} ini percuma?`,
        a: `Ya. Zento percuma, tanpa pendaftaran dan tanpa caj. Ia menggunakan data kadar pertukaran awam daripada ExchangeRate-API dan Bank Pusat Eropah.`,
      },
    ],
  },
} satisfies Record<Lang, unknown>;

function namesFor(parsed: { from: string; to: string }, lang: Lang): Names {
  return {
    ...parsed,
    fromName: currencyName(parsed.from, lang),
    toName: currencyName(parsed.to, lang),
  };
}

export async function pairMetadata(lang: Lang, slug: string): Promise<Metadata> {
  const parsed = parsePairSlug(slug);
  // Throwing here, not just in the page: Next resolves metadata before streaming for
  // crawlers, so this is what gives bots a real 404 instead of a soft-404 200.
  if (!parsed) notFound();
  const c = COPY[lang];
  const n = namesFor(parsed, lang);
  const snapshot = await getPairSnapshot(parsed.from, parsed.to);
  return pageMetadata(lang, pairPath(parsed.from, parsed.to), {
    title: c.title(n),
    description: c.description(n, snapshot),
    keywords: c.keywords(n),
    // Not every combination is indexable: ~23,000 near-identical URLs would dilute
    // crawl budget. lib/seo.ts decides which are; links on the rest are still followed.
    robots: isIndexablePair(parsed.from, parsed.to)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  });
}

const linkClass = 'text-ink-2 transition-colors hover:text-ink';

/** Plain links to neighbouring pairs and both currencies: crawl paths and next steps. */
function Related({ lang, from, to }: { lang: Lang; from: string; to: string }) {
  const c = COPY[lang];
  return (
    <div className="grid grid-cols-1 gap-10 sm:grid-cols-[2fr_1fr]">
      <div>
        <h3 className="mb-3 t-label text-ink-3">{c.related}</h3>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          {relatedPairs(from, to).map(([a, b]) => (
            <li key={`${a}-${b}`}>
              <Link href={localePath(lang, pairPath(a, b))} className={linkClass}>
                {c.pairLink(a, b)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 t-label text-ink-3">{c.profiles}</h3>
        <ul className="space-y-2.5 text-sm">
          {[from, to].map((code) => (
            <li key={code}>
              <Link href={localePath(lang, currencyPath(code))} className={linkClass}>
                {currencyName(code, lang)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export async function PairView({ lang, slug }: { lang: Lang; slug: string }) {
  const parsed = parsePairSlug(slug);
  if (!parsed) notFound();
  const c = COPY[lang];
  const n = namesFor(parsed, lang);

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

  const pageUrl = absoluteUrl(lang, pairPath(parsed.from, parsed.to));
  // Answers state the actual numbers when we have them. The FAQPage schema is built
  // from the same array, so visible text and structured data always agree.
  const faqItems = c.faq(n, snapshot);

  const structuredData = [
    // The live rate itself, in the vocabulary search engines and AI answers read
    ...(snapshot
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'ExchangeRateSpecification',
            name: c.heading(n),
            url: pageUrl,
            currency: parsed.from,
            currentExchangeRate: {
              '@type': 'UnitPriceSpecification',
              price: Number(snapshot.rate.toPrecision(6)),
              priceCurrency: parsed.to,
              validFrom: snapshot.date,
            },
          },
        ]
      : []),
    breadcrumbJsonLd([
      { name: c.home, url: absoluteUrl(lang, '/') },
      { name: c.heading(n), url: pageUrl },
    ]),
    faqJsonLd(faqItems),
  ];

  const details = (
    <div className="space-y-16">
      {snapshot && <PairInsights snapshot={snapshot} lang={lang} />}
      <div>
        <h3 className="mb-2 t-label text-ink-3">{c.questions}</h3>
        <Faq items={faqItems} />
      </div>
      <Related lang={lang} from={parsed.from} to={parsed.to} />
    </div>
  );

  return (
    <main>
      <JsonLd data={structuredData} />
      <ConverterSection
        initialFrom={parsed.from}
        initialTo={parsed.to}
        initialAmount={defaultAmount(snapshot?.rate)}
        heading={c.heading(n)}
        details={details}
        localCurrency={localCurrency}
        seedRates={seedRates}
      />
    </main>
  );
}

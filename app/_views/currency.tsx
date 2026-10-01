// A currency profile (/currency/myr, /ms/currency/myr): what it is, where it is used,
// what it is worth against the majors today and over the year, with links to every
// pair page that matters for it. Rendered per request for the same reason as pairs.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrency, hasHistory } from '@/lib/currencies';
import { countryCurrencies } from '@/lib/region';
import { getLatestTable, getPairSnapshot, type PairSnapshot, type RateTable } from '@/lib/rates';
import { formatDate, formatRate } from '@/lib/format';
import { countryName, currencyName, LANG_META, localePath, type Lang } from '@/lib/i18n';
import { currencyPath, pairPath } from '@/lib/paths';
import { isIndexablePair, MAJOR_CODES } from '@/lib/seo';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  Faq,
  faqJsonLd,
  JsonLd,
  pageMetadata,
  type FaqItem,
} from './shared';

/** How many majors the "worth today" table shows */
const TABLE_SIZE = 10;

export function parseCurrencySlug(slug: string): string | null {
  if (!/^[a-z]{3}$/.test(slug)) return null;
  const code = slug.toUpperCase();
  return getCurrency(code) ? code : null;
}

function countriesUsing(code: string, lang: Lang): string[] {
  const collator = new Intl.Collator(LANG_META[lang].html);
  return countryCurrencies()
    .filter(([, c]) => c === code)
    .map(([country]) => countryName(country, lang))
    .sort(collator.compare);
}

/** "A, B and C" in each language */
function joinList(items: string[], lang: Lang): string {
  if (items.length <= 1) return items.join('');
  const and = lang === 'ms' ? 'dan' : 'and';
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

interface Facts {
  code: string;
  name: string;
  symbol: string;
  countries: string[];
  /** The currency the yearly move is measured against: USD, or EUR for USD itself */
  anchor: string;
  table?: RateTable;
  trend?: PairSnapshot;
}

function pct(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

const COPY = {
  en: {
    title: (f: Facts) => `${f.name} (${f.code}): Exchange Rates, Symbol and Countries`,
    description: (f: Facts) =>
      `The ${f.name} (${f.code}, ${f.symbol})${f.countries.length ? ` is used in ${joinList(f.countries.slice(0, 4), 'en')}${f.countries.length > 4 ? ' and more' : ''}` : ''}. Live rates against the US dollar, euro and other majors, its move over the past year, and converters for every major pair.`,
    label: 'Currency',
    home: 'Home',
    usedIn: 'Used in',
    symbol: 'Symbol',
    code: 'Code',
    worth: (code: string) => `1 ${code} today`,
    buys: (code: string) => `What 1 ${code} buys`,
    costs: (code: string) => `What 1 of each costs in ${code}`,
    rateDate: (date: string) => `Mid-market rates, ${date}.`,
    unavailable: 'Live rates are unavailable right now.',
    year: (code: string, anchor: string) => `${code} against ${anchor} this year`,
    yearNote: 'European Central Bank reference rates. Past movement does not predict future rates.',
    yearHigh: '1-year high',
    yearLow: '1-year low',
    yearChange: '1-year change',
    noHistory: (code: string) =>
      `The European Central Bank does not publish ${code}, so there is no rate history for it. Live conversion still works.`,
    pairs: (code: string) => `Convert ${code}`,
    pairLink: (a: string, b: string) => `${a} to ${b}`,
    questions: 'Questions',
    faq: (f: Facts): FaqItem[] => {
      const usd = f.table?.rates.USD;
      const items: FaqItem[] = [];
      if (f.countries.length) {
        items.push({
          q: `Which countries use the ${f.name}?`,
          a: `The ${f.name} (${f.code}) is the currency of ${joinList(f.countries, 'en')}.`,
        });
      }
      items.push({
        q: `What is the symbol for the ${f.name}?`,
        a: `The ${f.name} is written ${f.symbol}, and its ISO 4217 code is ${f.code}. Zento's converter understands both, so you can type ${f.symbol}100 or 100 ${f.code.toLowerCase()}.`,
      });
      if (usd != null && f.code !== 'USD' && f.table) {
        items.push({
          q: `How much is 1 ${f.code} in US dollars?`,
          a: `On ${formatDate(f.table.date)}, 1 ${f.code} = ${formatRate(usd)} USD and 1 USD = ${formatRate(1 / usd)} ${f.code} at the mid-market rate.`,
        });
      }
      if (f.trend?.year) {
        const change = f.trend.year.changePct;
        items.push({
          q: `Is the ${f.name} getting stronger?`,
          a: `Over the past year the ${f.code} ${change >= 0 ? 'rose' : 'fell'} ${pct(change)} against the ${f.anchor}, trading between ${formatRate(f.trend.year.low)} and ${formatRate(f.trend.year.high)} ${f.anchor}. Past movement does not predict future rates.`,
        });
      }
      return items;
    },
  },
  ms: {
    title: (f: Facts) => `${f.name} (${f.code}): Kadar Pertukaran, Simbol dan Negara`,
    description: (f: Facts) =>
      `${f.name} (${f.code}, ${f.symbol})${f.countries.length ? ` digunakan di ${joinList(f.countries.slice(0, 4), 'ms')}${f.countries.length > 4 ? ' dan lain-lain' : ''}` : ''}. Kadar semasa berbanding dolar AS, euro dan mata wang utama lain, pergerakannya sepanjang tahun lalu, dan penukar untuk setiap pasangan utama.`,
    label: 'Mata wang',
    home: 'Utama',
    usedIn: 'Digunakan di',
    symbol: 'Simbol',
    code: 'Kod',
    worth: (code: string) => `1 ${code} hari ini`,
    buys: (code: string) => `Nilai 1 ${code}`,
    costs: (code: string) => `Harga setiap satu dalam ${code}`,
    rateDate: (date: string) => `Kadar pasaran tengah, ${date}.`,
    unavailable: 'Kadar semasa tidak tersedia buat masa ini.',
    year: (code: string, anchor: string) => `${code} berbanding ${anchor} tahun ini`,
    yearNote:
      'Kadar rujukan Bank Pusat Eropah. Pergerakan lalu tidak meramalkan kadar akan datang.',
    yearHigh: 'Tertinggi 1 tahun',
    yearLow: 'Terendah 1 tahun',
    yearChange: 'Perubahan 1 tahun',
    noHistory: (code: string) =>
      `Bank Pusat Eropah tidak menerbitkan ${code}, jadi tiada sejarah kadar untuknya. Penukaran semasa masih berfungsi.`,
    pairs: (code: string) => `Tukar ${code}`,
    pairLink: (a: string, b: string) => `${a} ke ${b}`,
    questions: 'Soalan',
    faq: (f: Facts): FaqItem[] => {
      const usd = f.table?.rates.USD;
      const items: FaqItem[] = [];
      if (f.countries.length) {
        items.push({
          q: `Negara manakah yang menggunakan ${f.name}?`,
          a: `${f.name} (${f.code}) ialah mata wang ${joinList(f.countries, 'ms')}.`,
        });
      }
      items.push({
        q: `Apakah simbol ${f.name}?`,
        a: `${f.name} ditulis sebagai ${f.symbol}, dan kod ISO 4217nya ialah ${f.code}. Penukar Zento memahami kedua-duanya, jadi anda boleh menaip ${f.symbol}100 atau 100 ${f.code.toLowerCase()}.`,
      });
      if (usd != null && f.code !== 'USD' && f.table) {
        items.push({
          q: `Berapakah 1 ${f.code} dalam dolar AS?`,
          a: `Pada ${formatDate(f.table.date, 'ms')}, 1 ${f.code} = ${formatRate(usd)} USD dan 1 USD = ${formatRate(1 / usd)} ${f.code} pada kadar pasaran tengah.`,
        });
      }
      if (f.trend?.year) {
        const change = f.trend.year.changePct;
        items.push({
          q: `Adakah ${f.name} semakin kukuh?`,
          a: `Sepanjang tahun lalu nilai 1 ${f.code} ${change >= 0 ? 'naik' : 'turun'} ${pct(change)} berbanding ${f.anchor}, antara ${formatRate(f.trend.year.low)} dan ${formatRate(f.trend.year.high)} ${f.anchor}. Pergerakan lalu tidak meramalkan kadar akan datang.`,
        });
      }
      return items;
    },
  },
} satisfies Record<Lang, unknown>;

/** Never throws: each upstream failure just drops its section. */
async function loadFacts(code: string, lang: Lang): Promise<Facts> {
  const currency = getCurrency(code)!;
  const anchor = code === 'USD' ? 'EUR' : 'USD';
  const [table, trend] = await Promise.all([
    getLatestTable(code).catch(() => undefined),
    hasHistory(code) && hasHistory(anchor)
      ? getPairSnapshot(code, anchor).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);
  return {
    code,
    name: currencyName(code, lang),
    symbol: currency.symbol,
    countries: countriesUsing(code, lang),
    anchor,
    table,
    trend,
  };
}

export async function currencyMetadata(lang: Lang, slug: string): Promise<Metadata> {
  const code = parseCurrencySlug(slug);
  if (!code) notFound();
  const c = COPY[lang];
  // Metadata needs names and countries only, not rates
  const facts: Facts = {
    code,
    name: currencyName(code, lang),
    symbol: getCurrency(code)!.symbol,
    countries: countriesUsing(code, lang),
    anchor: code === 'USD' ? 'EUR' : 'USD',
  };
  return pageMetadata(lang, currencyPath(code), {
    title: c.title(facts),
    description: c.description(facts),
  });
}

const linkClass = 'text-ink-2 transition-colors hover:text-ink';

export async function CurrencyView({ lang, slug }: { lang: Lang; slug: string }) {
  const code = parseCurrencySlug(slug);
  if (!code) notFound();
  const c = COPY[lang];
  const f = await loadFacts(code, lang);
  const majors = MAJOR_CODES.filter((m) => m !== code).slice(0, TABLE_SIZE);
  const faqItems = c.faq(f);
  const pageUrl = absoluteUrl(lang, currencyPath(code));

  const pairs = MAJOR_CODES.filter((m) => m !== code)
    .flatMap((m) => [
      [code, m],
      [m, code],
    ])
    .filter(([a, b]) => isIndexablePair(a, b));

  const structuredData = [
    breadcrumbJsonLd([
      { name: c.home, url: absoluteUrl(lang, '/') },
      { name: f.name, url: pageUrl },
    ]),
    ...(faqItems.length ? [faqJsonLd(faqItems)] : []),
  ];

  const year = f.trend?.year;

  return (
    <main className="mx-auto max-w-2xl px-5 pt-28 pb-16 sm:px-6 sm:pt-36">
      <JsonLd data={structuredData} />

      <p className="t-label text-ink-3">{c.label}</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">{f.name}</h1>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-[15px] sm:grid-cols-[auto_auto_1fr]">
        <div>
          <dt className="t-label text-ink-3">{c.code}</dt>
          <dd className="mt-1 text-ink">{code}</dd>
        </div>
        <div>
          <dt className="t-label text-ink-3">{c.symbol}</dt>
          <dd className="mt-1 text-ink">{f.symbol}</dd>
        </div>
        {f.countries.length > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <dt className="t-label text-ink-3">{c.usedIn}</dt>
            <dd className="mt-1 text-ink-2">{joinList(f.countries, lang)}</dd>
          </div>
        )}
      </dl>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">{c.worth(code)}</h2>
        {f.table ? (
          <>
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="t-label text-ink-3">
                  <th scope="col" className="pb-2 text-left font-normal">
                    <span className="sr-only">{c.label}</span>
                  </th>
                  <th scope="col" className="pb-2 text-right font-normal">
                    {c.buys(code)}
                  </th>
                  <th scope="col" className="pb-2 text-right font-normal">
                    {c.costs(code)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {majors
                  .filter((m) => f.table!.rates[m] != null)
                  .map((m) => {
                    const rate = f.table!.rates[m];
                    return (
                      <tr key={m} className="border-t border-line">
                        <th scope="row" className="py-2.5 text-left font-normal">
                          <Link
                            href={localePath(lang, pairPath(code, m))}
                            aria-label={c.pairLink(code, m)}
                            className="group flex items-baseline gap-3"
                          >
                            <span className="w-10 font-medium text-ink group-hover:text-accent">
                              {m}
                            </span>
                            <span className="hidden truncate text-ink-3 sm:inline">
                              {currencyName(m, lang)}
                            </span>
                          </Link>
                        </th>
                        <td className="py-2.5 text-right text-ink">{formatRate(rate)}</td>
                        <td className="py-2.5 text-right text-ink-2">{formatRate(1 / rate)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <p className="mt-3 t-label text-ink-3">{c.rateDate(formatDate(f.table.date, lang))}</p>
          </>
        ) : (
          <p className="text-[15px] text-ink-3">{c.unavailable}</p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">{c.year(code, f.anchor)}</h2>
        {year ? (
          <>
            <dl className="grid grid-cols-3 gap-6">
              {[
                { label: c.yearChange, value: pct(year.changePct), tone: year.changePct },
                { label: c.yearHigh, value: formatRate(year.high) },
                { label: c.yearLow, value: formatRate(year.low) },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="t-label text-ink-3">{s.label}</dt>
                  <dd
                    className={`mt-1 text-2xl font-light tracking-tight tabular-nums ${
                      s.tone == null ? 'text-ink' : s.tone >= 0 ? 'text-up' : 'text-down'
                    }`}
                  >
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 t-label text-ink-3">{c.yearNote}</p>
          </>
        ) : (
          <p className="text-[15px] text-ink-3">{c.noHistory(code)}</p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">{c.pairs(code)}</h2>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
          {pairs.map(([a, b]) => (
            <li key={`${a}-${b}`}>
              <Link href={localePath(lang, pairPath(a, b))} className={linkClass}>
                {c.pairLink(a, b)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {faqItems.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-2 t-h2 text-ink">{c.questions}</h2>
          <Faq items={faqItems} />
        </section>
      )}
    </main>
  );
}

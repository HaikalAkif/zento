// Server component: everything here is in the initial HTML, which is what search
// engines and AI crawlers read. Keep it free of client hooks.

import type { PairSnapshot, RangeStats } from '@/lib/rates';
import { amountLadder, formatAmount, formatDate, formatRate } from '@/lib/format';
import { currencyName, type Lang } from '@/lib/i18n';

interface Props {
  snapshot: PairSnapshot;
  lang: Lang;
}

const COPY = {
  en: {
    table: (from: string, to: string) => `${from} to ${to} conversion table`,
    summary: (inverse: string, date: React.ReactNode, from: string, amount: string, to: string) => (
      <>
        and 1 {inverse} at the mid-market rate on {date}, so 100 {from} is {amount} {to}.
      </>
    ),
    month: (pair: string, low: string, high: string, change: string) =>
      ` Over the last 30 days ${pair} traded between ${low} and ${high}, a ${change} move.`,
    ranges: 'Ranges',
    high30: '30-day high',
    low30: '30-day low',
    change30: '30-day change',
    avg30: '30-day average',
    high1y: '1-year high',
    low1y: '1-year low',
    past: 'In the past',
    ago: (n: number) => `${n} ${n === 1 ? 'year' : 'years'} ago`,
    since: 'since',
    tables: 'Conversion tables',
  },
  ms: {
    table: (from: string, to: string) => `Jadual penukaran ${from} ke ${to}`,
    summary: (inverse: string, date: React.ReactNode, from: string, amount: string, to: string) => (
      <>
        dan 1 {inverse} pada kadar pasaran tengah pada {date}, jadi 100 {from} bersamaan {amount}{' '}
        {to}.
      </>
    ),
    month: (pair: string, low: string, high: string, change: string) =>
      ` Dalam 30 hari lalu ${pair} diniagakan antara ${low} dan ${high}, perubahan ${change}.`,
    ranges: 'Julat',
    high30: 'Tertinggi 30 hari',
    low30: 'Terendah 30 hari',
    change30: 'Perubahan 30 hari',
    avg30: 'Purata 30 hari',
    high1y: 'Tertinggi 1 tahun',
    low1y: 'Terendah 1 tahun',
    past: 'Pada masa lalu',
    ago: (n: number) => `${n} tahun lalu`,
    since: 'sejak itu',
    tables: 'Jadual penukaran',
  },
};

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 t-label text-ink-3">{children}</h3>;
}

function ConversionTable({
  from,
  to,
  rate,
  lang,
}: {
  from: string;
  to: string;
  rate: number;
  lang: Lang;
}) {
  return (
    <table className="w-full text-sm tabular-nums">
      <caption className="sr-only">
        {COPY[lang].table(currencyName(from, lang), currencyName(to, lang))}
      </caption>
      <thead>
        <tr className="t-label text-ink-3">
          <th scope="col" className="pb-2 text-left font-normal">
            {from}
          </th>
          <th scope="col" className="pb-2 text-right font-normal">
            {to}
          </th>
        </tr>
      </thead>
      <tbody>
        {amountLadder(rate).map((amount) => (
          <tr key={amount}>
            <td className="py-1.5 text-ink-2">{amount.toLocaleString('en-US')}</td>
            <td className="py-1.5 text-right text-ink">{formatAmount(amount * rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function changeText(stats: RangeStats): { text: string; tone?: 'up' | 'down' } {
  const pct = stats.changePct;
  return {
    text: `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`,
    tone: pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : undefined,
  };
}

export default function PairInsights({ snapshot, lang }: Props) {
  const c = COPY[lang];
  const { from, to, rate, inverse, date, month, year, past } = snapshot;
  const monthChange = month && changeText(month);

  const stats =
    month && year && monthChange
      ? [
          { label: c.high30, value: formatRate(month.high) },
          { label: c.low30, value: formatRate(month.low) },
          { label: c.change30, value: monthChange.text, tone: monthChange.tone },
          { label: c.avg30, value: formatRate(month.average) },
          { label: c.high1y, value: formatRate(year.high) },
          { label: c.low1y, value: formatRate(year.low) },
        ]
      : [];

  return (
    <div className="space-y-16">
      <p className="text-[15px] leading-relaxed text-ink-2">
        <span className="text-ink">
          1 {from} = {formatRate(rate)} {to}
        </span>{' '}
        {c.summary(
          `${to} = ${formatRate(inverse)} ${from}`,
          <time dateTime={date}>{formatDate(date, lang)}</time>,
          currencyName(from, lang),
          formatAmount(100 * rate),
          currencyName(to, lang),
        )}
        {month &&
          monthChange &&
          c.month(`${from}/${to}`, formatRate(month.low), formatRate(month.high), monthChange.text)}
      </p>

      {stats.length > 0 && (
        <div>
          <Label>{c.ranges}</Label>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="t-label text-ink-3">{s.label}</dt>
                <dd
                  className={`mt-1 text-2xl font-light tracking-tight tabular-nums ${
                    s.tone === 'up' ? 'text-up' : s.tone === 'down' ? 'text-down' : 'text-ink'
                  }`}
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {past && past.length > 0 && (
        <div>
          <Label>{c.past}</Label>
          <ul className="space-y-2.5 text-sm tabular-nums">
            {past.map((p) => {
              const change = (rate / p.rate - 1) * 100;
              return (
                <li key={p.years} className="flex flex-wrap justify-between gap-x-4">
                  <span className="text-ink-2">
                    {c.ago(p.years)}, <time dateTime={p.date}>{formatDate(p.date, lang)}</time>
                  </span>
                  <span className="text-ink">
                    {formatRate(p.rate)} {to}
                    <span className={`ml-3 ${change >= 0 ? 'text-up' : 'text-down'}`}>
                      {change > 0 ? '+' : ''}
                      {change.toFixed(1)}% {c.since}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <Label>{c.tables}</Label>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <ConversionTable from={from} to={to} rate={rate} lang={lang} />
          <ConversionTable from={to} to={from} rate={inverse} lang={lang} />
        </div>
      </div>
    </div>
  );
}

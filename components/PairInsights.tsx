// Server component: everything here is in the initial HTML, which is what search
// engines and AI crawlers read. Keep it free of client hooks.

import type { PairSnapshot, RangeStats } from '@/lib/rates';
import { getCurrency } from '@/lib/currencies';
import { amountLadder, formatAmount, formatDate, formatRate } from '@/lib/format';

interface Props {
  snapshot: PairSnapshot;
}

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 t-label text-ink-3">{children}</h3>;
}

function ConversionTable({ from, to, rate }: { from: string; to: string; rate: number }) {
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);
  return (
    <table className="w-full text-sm tabular-nums">
      <caption className="sr-only">
        {fromCur?.name ?? from} to {toCur?.name ?? to} conversion table
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

export default function PairInsights({ snapshot }: Props) {
  const { from, to, rate, inverse, date, month, year, past } = snapshot;
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);
  const monthChange = month && changeText(month);

  const stats =
    month && year && monthChange
      ? [
          { label: '30-day high', value: formatRate(month.high) },
          { label: '30-day low', value: formatRate(month.low) },
          { label: '30-day change', value: monthChange.text, tone: monthChange.tone },
          { label: '30-day average', value: formatRate(month.average) },
          { label: '1-year high', value: formatRate(year.high) },
          { label: '1-year low', value: formatRate(year.low) },
        ]
      : [];

  return (
    <div className="space-y-16">
      <p className="text-[15px] leading-relaxed text-ink-2">
        <span className="text-ink">
          1 {from} = {formatRate(rate)} {to}
        </span>{' '}
        and 1 {to} = {formatRate(inverse)} {from} at the mid-market rate on{' '}
        <time dateTime={date}>{formatDate(date)}</time>, so 100 {fromCur?.name ?? from} is{' '}
        {formatAmount(100 * rate)} {toCur?.name ?? to}.
        {month && monthChange && (
          <>
            {' '}
            Over the last 30 days {from}/{to} traded between {formatRate(month.low)} and{' '}
            {formatRate(month.high)}, a {monthChange.text} move.
          </>
        )}
      </p>

      {stats.length > 0 && (
        <div>
          <Label>Ranges</Label>
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
          <Label>In the past</Label>
          <ul className="space-y-2.5 text-sm tabular-nums">
            {past.map((p) => {
              const change = (rate / p.rate - 1) * 100;
              return (
                <li key={p.years} className="flex flex-wrap justify-between gap-x-4">
                  <span className="text-ink-2">
                    {p.years} {p.years === 1 ? 'year' : 'years'} ago,{' '}
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                  </span>
                  <span className="text-ink">
                    {formatRate(p.rate)} {to}
                    <span className={`ml-3 ${change >= 0 ? 'text-up' : 'text-down'}`}>
                      {change > 0 ? '+' : ''}
                      {change.toFixed(1)}% since
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <Label>Conversion tables</Label>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <ConversionTable from={from} to={to} rate={rate} />
          <ConversionTable from={to} to={from} rate={inverse} />
        </div>
      </div>
    </div>
  );
}

// Server component: everything here is in the initial HTML, which is what search
// engines and AI crawlers read. Keep it free of client hooks.

import type { PairSnapshot, RangeStats } from '@/lib/rates';
import { getCurrency } from '@/lib/currencies';
import { amountLadder, formatAmount, formatDate, formatRate } from '@/lib/format';
import CurrencyMark from './CurrencyMark';

interface Props {
  snapshot: PairSnapshot;
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 t-h3 text-ink">{children}</h3>;
}

function ConversionTable({ from, to, rate }: { from: string; to: string; rate: number }) {
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);
  return (
    <div className="min-w-0">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <CurrencyMark code={from} size="sm" />
        {from} to {to}
      </p>
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">
          {fromCur?.name ?? from} to {toCur?.name ?? to} conversion table
        </caption>
        <thead>
          <tr className="text-xs text-ink-3">
            <th scope="col" className="py-2 text-left font-normal">
              {from}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {to}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line border-t border-line-strong">
          {amountLadder(rate).map((amount) => (
            <tr key={amount}>
              <td className="py-2 text-ink-2">
                {fromCur?.symbol}
                {amount.toLocaleString('en-US')}
              </td>
              <td className="py-2 text-right font-medium text-ink">
                {toCur?.symbol}
                {formatAmount(amount * rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="border-b border-line py-4 pr-4">
      <dt className="t-label text-ink-3">{label}</dt>
      <dd
        className={`mt-1.5 t-stat ${
          tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function changeLabel(stats: RangeStats): { value: string; tone?: 'up' | 'down' } {
  const pct = stats.changePct;
  const value = `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
  return { value, tone: pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : undefined };
}

export default function PairInsights({ snapshot }: Props) {
  const { from, to, rate, inverse, date, month, year, past } = snapshot;
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);
  const monthChange = month && changeLabel(month);

  return (
    <div className="space-y-12">
      <div>
        <Subhead>
          {from} to {to} exchange rate today
        </Subhead>
        <p className="max-w-3xl text-lg leading-relaxed text-ink sm:text-xl">
          1 {from} ={' '}
          <span className="text-accent">
            {formatRate(rate)} {to}
          </span>
          , and 1 {to} = {formatRate(inverse)} {from}, at the mid-market rate on{' '}
          <time dateTime={date}>{formatDate(date)}</time>. So 100 {fromCur?.name ?? from} is{' '}
          {formatAmount(100 * rate)} {toCur?.name ?? to}.
          {month && monthChange && (
            <span className="text-ink-2">
              {' '}
              Over 30 days {from}/{to} traded between {formatRate(month.low)} and{' '}
              {formatRate(month.high)}, a {monthChange.value} move.
            </span>
          )}
        </p>
      </div>

      {month && year && monthChange && (
        <div>
          <Subhead>Ranges</Subhead>
          <dl className="grid grid-cols-2 border-t border-line-strong sm:grid-cols-3">
            <Stat label="30-day high" value={formatRate(month.high)} />
            <Stat label="30-day low" value={formatRate(month.low)} />
            <Stat label="30-day change" value={monthChange.value} tone={monthChange.tone} />
            <Stat label="30-day average" value={formatRate(month.average)} />
            <Stat label="1-year high" value={formatRate(year.high)} />
            <Stat label="1-year low" value={formatRate(year.low)} />
          </dl>
        </div>
      )}

      {past && past.length > 0 && (
        <div>
          <Subhead>
            {from} to {to} in the past
          </Subhead>
          <ul className="border-t border-line-strong">
            {past.map((p) => {
              const change = (rate / p.rate - 1) * 100;
              return (
                <li
                  key={p.years}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-3"
                >
                  <span className="text-sm text-ink-2">
                    {p.years} {p.years === 1 ? 'year' : 'years'} ago,{' '}
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                  </span>
                  <span className="text-sm font-medium text-ink tabular-nums">
                    1 {from} = {formatRate(p.rate)} {to}
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
        <Subhead>Conversion tables</Subhead>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <ConversionTable from={from} to={to} rate={rate} />
          <ConversionTable from={to} to={from} rate={inverse} />
        </div>
      </div>
    </div>
  );
}

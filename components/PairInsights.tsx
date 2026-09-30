// Server component: everything here is in the initial HTML, which is what search
// engines and AI crawlers read. Keep it free of client hooks.

import type { PairSnapshot, RangeStats } from '@/lib/rates';
import { getCurrency } from '@/lib/currencies';
import { amountLadder, formatAmount, formatDate, formatRate } from '@/lib/format';

interface Props {
  snapshot: PairSnapshot;
}

function ConversionTable({ from, to, rate }: { from: string; to: string; rate: number }) {
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        {fromCur?.flag} {from} to {toCur?.flag} {to}
      </h3>
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">
          {fromCur?.name ?? from} to {toCur?.name ?? to} conversion table
        </caption>
        <thead>
          <tr className="text-[11px] tracking-wider text-slate-400 uppercase">
            <th scope="col" className="pb-2 text-left font-semibold">
              {from}
            </th>
            <th scope="col" className="pb-2 text-right font-semibold">
              {to}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {amountLadder(rate).map((amount) => (
            <tr key={amount}>
              <td className="py-2 text-slate-300">
                {fromCur?.symbol} {amount.toLocaleString('en-US')} {from}
              </td>
              <td className="py-2 text-right font-semibold text-slate-100">
                {toCur?.symbol} {formatAmount(amount * rate)} {to}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const color =
    tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-red-400' : 'text-slate-100';
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
      <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</dt>
      <dd className={`mt-1 text-base font-bold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function changeLabel(stats: RangeStats): { value: string; tone?: 'up' | 'down' } {
  const pct = stats.changePct;
  const value = `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
  return { value, tone: pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : undefined };
}

export default function PairInsights({ snapshot }: Props) {
  const { from, to, rate, inverse, date, month, year } = snapshot;
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);
  const monthChange = month && changeLabel(month);

  return (
    <>
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7">
        <h2 className="mb-2 text-base font-bold text-slate-50">
          {from} to {to} exchange rate today
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          <strong className="text-slate-50">
            1 {from} = {formatRate(rate)} {to}
          </strong>{' '}
          and 1 {to} = {formatRate(inverse)} {from}, at the mid-market rate as of{' '}
          <time dateTime={date}>{formatDate(date)}</time>. That means 100 {fromCur?.name ?? from} is
          worth {formatAmount(100 * rate)} {toCur?.name ?? to}.
          {month && monthChange && (
            <>
              {' '}
              Over the past 30 days {from}/{to} has traded between {formatRate(month.low)} and{' '}
              {formatRate(month.high)}, a {monthChange.value} move.
            </>
          )}
        </p>

        {month && year && monthChange && (
          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <StatTile label="30-day high" value={formatRate(month.high)} />
            <StatTile label="30-day low" value={formatRate(month.low)} />
            <StatTile label="30-day change" value={monthChange.value} tone={monthChange.tone} />
            <StatTile label="30-day average" value={formatRate(month.average)} />
            <StatTile label="1-year high" value={formatRate(year.high)} />
            <StatTile label="1-year low" value={formatRate(year.low)} />
          </dl>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7">
        <h2 className="mb-5 text-base font-bold text-slate-50">
          {from} / {to} conversion tables
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <ConversionTable from={from} to={to} rate={rate} />
          <ConversionTable from={to} to={from} rate={inverse} />
        </div>
      </section>
    </>
  );
}

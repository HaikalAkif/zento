/** Rate with precision that suits its size: 4,081.23 · 4.0810 · 0.02847 */
export function formatRate(rate: number): string {
  if (rate >= 100)
    return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (rate >= 1) return rate.toFixed(4);
  return rate.toPrecision(4);
}

/** Money amount: 2 decimals, more only when the value is tiny. */
export function formatAmount(value: number): string {
  if (value !== 0 && Math.abs(value) < 0.01) return value.toPrecision(3);
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "2026-09-30" → "30 Sep 2026", without timezone drift. */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const LADDER = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000];

/**
 * Amounts worth showing in a conversion table for a currency worth `rate` units of
 * the target. Weak currencies get scaled up: nobody converts 1 JPY or 1 IDR.
 */
export function amountLadder(rate: number): number[] {
  const scale = rate < 0.1 ? 10 ** Math.round(-Math.log10(rate)) : 1;
  return LADDER.map((a) => a * scale);
}

/**
 * A starting amount worth converting. 1 USD says something; 1 JPY or 1 IDR is a
 * rounding error, so weak currencies open on a round amount people actually spend.
 */
export function defaultAmount(rate: number | undefined): string {
  if (!rate || rate >= 0.1) return '1';
  return String(10 ** Math.round(1 - Math.log10(rate)));
}

/**
 * Decimal places that keep a value meaningful: 2 normally, more for tiny values so
 * 1 IDR in USD reads 0.000062 rather than 0.00.
 */
export function decimalsFor(value: number): number {
  const abs = Math.abs(value);
  if (abs === 0 || abs >= 0.01) return 2;
  return Math.min(8, Math.ceil(-Math.log10(abs)) + 2);
}

/** An amount as the user entered it: no forced decimals, e.g. 1,000 or 0.5. */
export function formatPlain(value: number): string {
  if (value !== 0 && Math.abs(value) < 0.01) return value.toPrecision(3);
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

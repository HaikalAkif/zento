import { CURRENCIES, getCurrency } from './currencies';
import { pairPath } from './paths';

/**
 * Currencies people convert between most. Every pair among these is indexable, and
 * every supported currency is indexable against USD. That covers what people search
 * for (about 640 pages) without asking Google to crawl all ~23,000 combinations.
 */
const MAJORS = new Set([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CNY',
  'AUD',
  'CAD',
  'CHF',
  'HKD',
  'SGD',
  'MYR',
  'INR',
  'IDR',
  'THB',
  'PHP',
  'KRW',
  'NZD',
  'AED',
  'SAR',
  'ZAR',
]);

export function isIndexablePair(from: string, to: string): boolean {
  if (from === to || !getCurrency(from) || !getCurrency(to)) return false;
  return (MAJORS.has(from) && MAJORS.has(to)) || from === 'USD' || to === 'USD';
}

/**
 * Every indexable pair, majors first so the sitemap leads with the busiest. `major`
 * marks pairs where both sides are majors.
 */
export function indexablePairs(): { path: string; major: boolean }[] {
  const seen = new Set<string>();
  const out: { path: string; major: boolean }[] = [];
  const add = (from: string, to: string) => {
    const path = pairPath(from, to);
    if (!seen.has(path) && isIndexablePair(from, to)) {
      seen.add(path);
      out.push({ path, major: MAJORS.has(from) && MAJORS.has(to) });
    }
  };
  for (const a of MAJORS) for (const b of MAJORS) add(a, b);
  for (const c of CURRENCIES) {
    add('USD', c.code);
    add(c.code, 'USD');
  }
  return out;
}

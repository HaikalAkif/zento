import { CURRENCIES, getCurrency } from './currencies';
import { pairPath } from './paths';

/**
 * Currencies people convert between most. Every pair among these is indexable, and
 * every supported currency is indexable against USD. That covers what people search
 * for (about 640 pages) without asking Google to crawl all ~23,000 combinations.
 */
export const MAJOR_CODES = [
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
];
const MAJORS = new Set(MAJOR_CODES);

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

/**
 * Pairs worth linking to from a pair page: the reverse, then the source and the target
 * against the busiest majors. Only indexable pairs, so every link leads somewhere that
 * can rank. About 8, enough to spread crawl paths without turning into a link farm.
 */
export function relatedPairs(from: string, to: string, limit = 8): [string, string][] {
  const out: [string, string][] = [];
  const seen = new Set<string>([`${from}-${to}`]);
  const add = (a: string, b: string) => {
    const key = `${a}-${b}`;
    if (out.length < limit && !seen.has(key) && isIndexablePair(a, b)) {
      seen.add(key);
      out.push([a, b]);
    }
  };
  add(to, from);
  // Alternate sides so both currencies get links before the list fills up
  for (const m of MAJOR_CODES) {
    add(from, m);
    add(m, to);
  }
  return out;
}

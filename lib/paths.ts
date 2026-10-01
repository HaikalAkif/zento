import { localePath, splitLangPath, type Lang } from './i18n';

/** "/usd-to-myr" (language-neutral; wrap with localePath for /ms) */
export function pairPath(from: string, to: string): string {
  return `/${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

/** "/currency/myr" */
export function currencyPath(code: string): string {
  return `/currency/${code.toLowerCase()}`;
}

/**
 * Pair path in a language, plus ?amount. The amount is always kept: each pair has its
 * own default (1 USD, but 100,000 IDR), so leaving it out would change the amount on
 * reload or share.
 */
export function pairHref(from: string, to: string, amount: string, lang: Lang = 'en'): string {
  const path = localePath(lang, pairPath(from, to));
  const n = parseFloat(amount);
  return n > 0 ? `${path}?amount=${encodeURIComponent(amount)}` : path;
}

/** "/usd-to-myr" or "/ms/usd-to-myr" → { from: "USD", to: "MYR" }; null otherwise. */
export function parsePairPath(pathname: string): { from: string; to: string } | null {
  const m = splitLangPath(pathname).path.match(/^\/([a-z]{3})-to-([a-z]{3})\/?$/);
  return m ? { from: m[1].toUpperCase(), to: m[2].toUpperCase() } : null;
}

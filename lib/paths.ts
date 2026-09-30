/** "/usd-to-myr" */
export function pairPath(from: string, to: string): string {
  return `/${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

/**
 * Path plus ?amount. The amount is always kept: each pair has its own default (1 USD,
 * but 100,000 IDR), so leaving it out would change the amount on reload or share.
 */
export function pairHref(from: string, to: string, amount: string): string {
  const n = parseFloat(amount);
  return n > 0 ? `${pairPath(from, to)}?amount=${encodeURIComponent(amount)}` : pairPath(from, to);
}

/** "/usd-to-myr" → { from: "USD", to: "MYR" }, or null for any other path. */
export function parsePairPath(path: string): { from: string; to: string } | null {
  const m = path.match(/^\/([a-z]{3})-to-([a-z]{3})\/?$/);
  return m ? { from: m[1].toUpperCase(), to: m[2].toUpperCase() } : null;
}

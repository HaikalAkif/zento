// All upstream calls go through this app's API routes. Fetching the rate providers
// straight from the browser would skip Next's cache entirely (`next: { revalidate }`
// is server-only), hit their rate limits once per visitor, and leak visitor IPs.

export interface RateResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface ChartDataPoint {
  date: string;
  rate: number;
}

async function fetchRates(base: string, symbols: string[]): Promise<RateResponse> {
  const res = await fetch(`/api/rates?base=${base}&symbols=${symbols.join(',')}`);
  if (res.status === 429) throw new Error('Rate limited, try again in a moment');
  if (!res.ok) throw new Error(`Rates unavailable (HTTP ${res.status})`);
  return res.json();
}

export function getLatestRate(base: string, target: string): Promise<RateResponse> {
  return fetchRates(base, [target]);
}

export function getMultipleRates(base: string, targets: string[]): Promise<RateResponse> {
  return fetchRates(base, targets.filter((t) => t !== base));
}

export async function getHistoricalRates(
  base: string,
  target: string,
  days: number,
): Promise<ChartDataPoint[]> {
  const res = await fetch(`/api/historical?base=${base}&target=${target}&days=${days}`);
  if (res.status === 429) throw new Error('Rate limited, try again in a moment');
  if (!res.ok) throw new Error(`Chart data unavailable (HTTP ${res.status})`);
  return res.json();
}

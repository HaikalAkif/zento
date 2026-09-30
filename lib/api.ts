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
  return fetchRates(
    base,
    targets.filter((t) => t !== base),
  );
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

async function getJson<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url);
  if (res.status === 429) throw new Error('Rate limited, try again in a moment');
  if (res.status === 404) throw new Error(`No ${what} published for this selection`);
  if (!res.ok) throw new Error(`${what} unavailable (HTTP ${res.status})`);
  return res.json();
}

export interface TimeMachineResponse {
  base: string;
  target: string;
  then: { date: string; rate: number };
  now: { date: string; rate: number };
}

export function getTimeMachine(
  base: string,
  target: string,
  date: string,
): Promise<TimeMachineResponse> {
  return getJson(`/api/time-machine?base=${base}&target=${target}&date=${date}`, 'ECB rate');
}

export interface StrengthEntry {
  code: string;
  /** Units of `code` one unit of base buys today */
  now: number;
  /** ...and a year ago */
  then: number;
  /** Positive: base buys more of `code` than a year ago, i.e. your money goes further there */
  changePct: number;
}

export interface StrengthResponse {
  base: string;
  date: string;
  since: string;
  entries: StrengthEntry[];
}

export function getStrength(base: string): Promise<StrengthResponse> {
  return getJson(`/api/strength?base=${base}`, 'strength data');
}

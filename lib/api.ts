// Primary: Frankfurter (ECB data, free, no key, supports historical)
const FRANKFURTER = 'https://api.frankfurter.app';

// Fallback: ExchangeRate-API open tier (free, no key, latest rates only)
const FALLBACK = 'https://open.er-api.com/v6/latest';

export interface RateResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface HistoricalResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export interface ChartDataPoint {
  date: string;
  rate: number;
}

// ── Fallback (open.er-api.com) ─────────────────────────────────────────────

interface OpenErResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

async function fallbackLatest(base: string, targets: string[]): Promise<RateResponse> {
  const res = await fetch(`${FALLBACK}/${base}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Fallback API error: HTTP ${res.status}`);
  const data: OpenErResponse = await res.json();
  if (data.result !== 'success') throw new Error('Fallback API returned an error result');

  const rates: Record<string, number> = {};
  for (const t of targets) {
    if (data.rates[t] != null) rates[t] = data.rates[t];
  }

  return {
    amount: 1,
    base: data.base_code,
    date: new Date(data.time_last_update_utc).toISOString().split('T')[0],
    rates,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getLatestRate(base: string, target: string): Promise<RateResponse> {
  try {
    const res = await fetch(`${FRANKFURTER}/latest?base=${base}&symbols=${target}`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 429) throw new Error('Rate limited');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return fallbackLatest(base, [target]);
  }
}

export async function getMultipleRates(base: string, targets: string[]): Promise<RateResponse> {
  const symbols = targets.filter((t) => t !== base);
  try {
    const res = await fetch(`${FRANKFURTER}/latest?base=${base}&symbols=${symbols.join(',')}`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 429) throw new Error('Rate limited');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return fallbackLatest(base, symbols);
  }
}

export async function getHistoricalRates(
  base: string,
  target: string,
  days: number,
): Promise<ChartDataPoint[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const res = await fetch(
    `${FRANKFURTER}/${startStr}..${endStr}?base=${base}&symbols=${target}`,
    { next: { revalidate: 3600 } },
  );

  if (res.status === 429) throw new Error('Rate limited — try again in a moment');
  if (!res.ok) throw new Error(`Chart data unavailable (HTTP ${res.status})`);

  const data: HistoricalResponse = await res.json();

  return Object.entries(data.rates)
    .map(([date, rates]) => ({ date, rate: rates[target] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Primary: open.er-api.com (free, no key, 166+ currencies, latest rates only)
const ER_API = 'https://open.er-api.com/v6/latest';

// Fallback: Frankfurter (free, no key, ~32 currencies, also powers historical)
const FRANKFURTER = 'https://api.frankfurter.app';

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

interface OpenErResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

// ── Primary (open.er-api.com) ──────────────────────────────────────────────

async function primaryLatest(base: string, targets: string[]): Promise<RateResponse> {
  const res = await fetch(`${ER_API}/${base}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`ER-API error: HTTP ${res.status}`);
  const data: OpenErResponse = await res.json();
  if (data.result !== 'success') throw new Error('ER-API returned an error');

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

// ── Fallback (Frankfurter) ─────────────────────────────────────────────────

async function frankfurterLatest(base: string, targets: string[]): Promise<RateResponse> {
  const res = await fetch(
    `${FRANKFURTER}/latest?base=${base}&symbols=${targets.join(',')}`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) throw new Error(`Frankfurter error: HTTP ${res.status}`);
  return res.json();
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getLatestRate(base: string, target: string): Promise<RateResponse> {
  try {
    return await primaryLatest(base, [target]);
  } catch {
    return frankfurterLatest(base, [target]);
  }
}

export async function getMultipleRates(base: string, targets: string[]): Promise<RateResponse> {
  const symbols = targets.filter((t) => t !== base);
  try {
    return await primaryLatest(base, symbols);
  } catch {
    return frankfurterLatest(base, symbols);
  }
}

// Historical is Frankfurter-only (open.er-api.com requires paid plan for history)
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

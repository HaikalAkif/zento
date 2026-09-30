// Server-side rate data, shared by the API routes and server-rendered pages.
//
// Next's fetch data cache (`next: { revalidate }`) is a no-op on Cloudflare unless an
// incrementalCache override is configured in open-next.config.ts, so upstream data is
// cached here instead, in two tiers:
//   1. an in-memory map, which lives as long as the Worker isolate
//   2. the Workers Cache API, shared by every isolate in the data centre
// In `next dev` (Node) `caches` is undefined and only tier 1 applies.

import { APP_URL } from './config';
import { pairHasHistory } from './currencies';
import { ECB_START, yearsAgo } from './dates';

export { ECB_START, yearsAgo };

const ER_API = 'https://open.er-api.com/v6/latest';
// Canonical host. api.frankfurter.app 301s here, costing a redirect on every call.
const FRANKFURTER = 'https://api.frankfurter.dev/v1';

const LATEST_TTL = 60 * 60;
const HISTORY_TTL = 60 * 60;

export interface RateTable {
  base: string;
  /** YYYY-MM-DD of the upstream publication */
  date: string;
  rates: Record<string, number>;
}

export interface HistoryPoint {
  date: string;
  rate: number;
}

export class UpstreamError extends Error {
  constructor(
    readonly status: 429 | 502,
    message: string,
  ) {
    super(message);
  }
}

// ── Cache ────────────────────────────────────────────────────────────────────

type WorkersCache = {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
};

function edgeCache(): WorkersCache | undefined {
  return (globalThis as { caches?: { default?: WorkersCache } }).caches?.default;
}

const memory = new Map<string, { expires: number; value: unknown }>();
// `days` is caller-controlled, so bound the map. Maps iterate in insertion order,
// so deleting the first key drops the oldest entry.
const MEMORY_MAX = 300;

function remember(key: string, ttl: number, value: unknown): void {
  memory.delete(key);
  memory.set(key, { expires: Date.now() + ttl * 1000, value });
  if (memory.size > MEMORY_MAX) memory.delete(memory.keys().next().value!);
}

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const mem = memory.get(key);
  if (mem && mem.expires > Date.now()) return mem.value as T;

  // Cache API keys must be URLs; a path on our own host keeps entries in our zone.
  const cacheKey = `${APP_URL}/__cache/${key}`;
  const cache = edgeCache();

  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const value = (await hit.json()) as T;
        remember(key, ttl, value);
        return value;
      }
    } catch {
      // Cache reads are best-effort. Fall through to the upstream.
    }
  }

  const value = await load();
  remember(key, ttl, value);

  if (cache) {
    try {
      await cache.put(
        cacheKey,
        new Response(JSON.stringify(value), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${ttl}` },
        }),
      );
    } catch {
      // Cache writes are best-effort. Never fail the request over it.
    }
  }
  return value;
}

// ── Latest rates ─────────────────────────────────────────────────────────────

interface OpenErResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

async function loadLatest(base: string): Promise<RateTable> {
  // Primary: open.er-api.com, ~160 currencies
  try {
    const res = await fetch(`${ER_API}/${base}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: OpenErResponse = await res.json();
    if (data.result !== 'success') throw new Error('ER-API returned an error');
    return {
      base: data.base_code,
      date: new Date(data.time_last_update_utc).toISOString().split('T')[0],
      rates: data.rates,
    };
  } catch {
    // Fall through to Frankfurter
  }

  // Fallback: Frankfurter, the ~30 ECB currencies
  let res: Response;
  try {
    res = await fetch(`${FRANKFURTER}/latest?base=${base}`);
  } catch {
    throw new UpstreamError(502, 'Failed to fetch rates');
  }
  if (res.status === 429) throw new UpstreamError(429, 'Rate limited');
  if (!res.ok) throw new UpstreamError(502, `Upstream error: HTTP ${res.status}`);
  const data: { base: string; date: string; rates: Record<string, number> } = await res.json();
  return { base: data.base, date: data.date, rates: data.rates };
}

/** Every rate for `base`. Callers must pass a validated currency code. */
export function getLatestTable(base: string): Promise<RateTable> {
  return cached(`latest/${base}`, LATEST_TTL, () => loadLatest(base));
}

// ── History ──────────────────────────────────────────────────────────────────

async function loadHistory(base: string, target: string, days: number): Promise<HistoryPoint[]> {
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - days);
  const startStr = start.toISOString().split('T')[0];
  const endStr = now.toISOString().split('T')[0];

  let res: Response;
  try {
    res = await fetch(`${FRANKFURTER}/${startStr}..${endStr}?base=${base}&symbols=${target}`);
  } catch {
    throw new UpstreamError(502, 'Failed to fetch historical data');
  }
  if (res.status === 429) throw new UpstreamError(429, 'Rate limited');
  if (!res.ok) throw new UpstreamError(502, `Upstream error: HTTP ${res.status}`);

  const data: { rates: Record<string, Record<string, number>> } = await res.json();
  return Object.entries(data.rates)
    .map(([date, rates]) => ({ date, rate: rates[target] }))
    .filter((p) => p.rate != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Daily ECB history. Callers must check `pairHasHistory` first: anything outside
 * the ECB's ~30 currencies 404s upstream.
 */
export function getHistory(base: string, target: string, days: number): Promise<HistoryPoint[]> {
  return cached(`history/${base}/${target}/${days}`, HISTORY_TTL, () =>
    loadHistory(base, target, days),
  );
}

// ── Page helpers ─────────────────────────────────────────────────────────────

/**
 * Rates to seed the client converter with, in the /api/rates response shape.
 * Never throws: on upstream failure the page renders and the client fetches instead.
 */
export async function seedRatesFor(
  from: string,
  to: string,
): Promise<
  { amount: number; base: string; date: string; rates: Record<string, number> } | undefined
> {
  if (from === to) return undefined;
  try {
    const table = await getLatestTable(from);
    const rate = table.rates[to];
    if (rate == null) return undefined;
    return { amount: 1, base: table.base, date: table.date, rates: { [to]: rate } };
  } catch {
    return undefined;
  }
}

export interface RangeStats {
  high: number;
  low: number;
  average: number;
  /** Percent change from the first to the last point in the range */
  changePct: number;
}

export interface PairSnapshot {
  from: string;
  to: string;
  rate: number;
  inverse: number;
  date: string;
  /** ECB-backed pairs only */
  month?: RangeStats;
  year?: RangeStats;
  /** ECB rate on the same day 1, 5 and 10 years ago. ECB-backed pairs only. */
  past?: { years: number; date: string; rate: number }[];
}

function rangeStats(points: HistoryPoint[]): RangeStats | undefined {
  if (points.length < 2) return undefined;
  const rates = points.map((p) => p.rate);
  const first = rates[0];
  const last = rates[rates.length - 1];
  return {
    high: Math.max(...rates),
    low: Math.min(...rates),
    average: rates.reduce((a, b) => a + b, 0) / rates.length,
    changePct: ((last - first) / first) * 100,
  };
}

/**
 * Everything a pair page states as fact: live rate, inverse, and 30-day / 1-year
 * ranges where the ECB publishes both currencies. Never throws; undefined means
 * the page falls back to client-side rates only.
 */
export async function getPairSnapshot(from: string, to: string): Promise<PairSnapshot | undefined> {
  const seed = await seedRatesFor(from, to);
  if (!seed) return undefined;
  const rate = seed.rates[to];
  const snapshot: PairSnapshot = { from, to, rate, inverse: 1 / rate, date: seed.date };

  if (pairHasHistory(from, to)) {
    try {
      const year = await getHistory(from, to, 365);
      const cutoff = new Date();
      cutoff.setUTCDate(cutoff.getUTCDate() - 30);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      snapshot.year = rangeStats(year);
      snapshot.month = rangeStats(year.filter((p) => p.date >= cutoffStr));
    } catch {
      // Stats are a bonus. The live rate alone is still worth rendering.
    }
    const past = await Promise.all(
      [1, 5, 10].map(async (years) => {
        try {
          const table = await getEcbTable(from, yearsAgo(years));
          const pastRate = table.rates[to];
          return pastRate == null ? null : { years, date: table.date, rate: pastRate };
        } catch {
          return null;
        }
      }),
    );
    snapshot.past = past.filter((p) => p != null);
  }
  return snapshot;
}

// ── ECB snapshots by date ────────────────────────────────────────────────────

/**
 * All ECB rates for `base` on `date` ('latest' for the newest publication). A weekend
 * or holiday resolves to the previous business day; the returned `date` says which.
 * Past dates never change, so they're cached for a month.
 */
export function getEcbTable(base: string, date: string | 'latest'): Promise<RateTable> {
  const ttl = date === 'latest' ? LATEST_TTL : 30 * 24 * 60 * 60;
  return cached(`ecb/${base}/${date}`, ttl, async () => {
    let res: Response;
    try {
      res = await fetch(`${FRANKFURTER}/${date}?base=${base}`);
    } catch {
      throw new UpstreamError(502, 'Failed to fetch ECB rates');
    }
    if (res.status === 429) throw new UpstreamError(429, 'Rate limited');
    if (!res.ok) throw new UpstreamError(502, `Upstream error: HTTP ${res.status}`);
    const data: { base: string; date: string; rates: Record<string, number> } = await res.json();
    return { base: data.base, date: data.date, rates: data.rates };
  });
}

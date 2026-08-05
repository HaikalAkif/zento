import { NextRequest, NextResponse } from 'next/server';
import { getCurrency } from '@/lib/currencies';
import { withEdgeCache } from '@/lib/edge-cache';

// Primary: open.er-api.com (free, no key)
const ER_API = 'https://open.er-api.com/v6/latest';
// Fallback: Frankfurter (free, no key, 30 ECB currencies). Canonical host:
// api.frankfurter.app 301s here, costing a redirect on every call.
const FRANKFURTER = 'https://api.frankfurter.dev/v1';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
};

interface OpenErResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

async function fetchRates(base: string, symbols: string[]): Promise<Response> {
  try {
    const res = await fetch(`${ER_API}/${base}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: OpenErResponse = await res.json();
    if (data.result !== 'success') throw new Error('ER-API returned an error');

    const rates: Record<string, number> = {};
    for (const s of symbols) {
      if (data.rates[s] != null) rates[s] = data.rates[s];
    }

    return NextResponse.json(
      {
        amount: 1,
        base: data.base_code,
        date: new Date(data.time_last_update_utc).toISOString().split('T')[0],
        rates,
      },
      { headers: CACHE_HEADERS },
    );
  } catch {
    // Fall through to Frankfurter
  }

  try {
    const res = await fetch(
      `${FRANKFURTER}/latest?base=${base}&symbols=${symbols.join(',')}`,
      { next: { revalidate: 3600 } },
    );
    if (res.status === 429) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error: HTTP ${res.status}` }, { status: 502 });
    }
    return NextResponse.json(await res.json(), { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = (searchParams.get('base') ?? '').toUpperCase();
  const symbols = (searchParams.get('symbols') ?? '')
    .toUpperCase()
    .split(',')
    .filter(Boolean);

  // Validate before anything reaches the upstream URL
  if (!/^[A-Z]{3}$/.test(base) || !getCurrency(base)) {
    return NextResponse.json({ error: 'Invalid base currency' }, { status: 400 });
  }
  if (symbols.length === 0 || symbols.length > 40) {
    return NextResponse.json({ error: 'symbols must list 1–40 currencies' }, { status: 400 });
  }
  if (symbols.some((s) => !/^[A-Z]{3}$/.test(s) || !getCurrency(s))) {
    return NextResponse.json({ error: 'Invalid symbol in list' }, { status: 400 });
  }

  return withEdgeCache(request, () => fetchRates(base, symbols));
}

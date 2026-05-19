import { NextRequest, NextResponse } from 'next/server';
import { getCurrency } from '@/lib/currencies';

const FRANKFURTER = 'https://api.frankfurter.app';

interface FrankfurterHistorical {
  rates: Record<string, Record<string, number>>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = (searchParams.get('base') ?? '').toUpperCase();
  const target = (searchParams.get('target') ?? '').toUpperCase();
  const daysParam = searchParams.get('days');

  // Validate format before anything else — prevents URL injection into upstream fetch
  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(target)) {
    return NextResponse.json({ error: 'Invalid currency code format' }, { status: 400 });
  }

  if (!getCurrency(base) || !getCurrency(target)) {
    return NextResponse.json({ error: 'Unknown currency code' }, { status: 400 });
  }

  if (!daysParam) {
    return NextResponse.json({ error: 'Missing days parameter' }, { status: 400 });
  }

  const days = parseInt(daysParam, 10);
  if (isNaN(days) || days < 1 || days > 400) {
    return NextResponse.json({ error: 'days must be between 1 and 400' }, { status: 400 });
  }

  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - days);
  const startStr = start.toISOString().split('T')[0];
  const endStr = now.toISOString().split('T')[0];

  try {
    const res = await fetch(
      `${FRANKFURTER}/${startStr}..${endStr}?base=${base}&symbols=${target}`,
      { next: { revalidate: 3600 } },
    );

    if (res.status === 429) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error: HTTP ${res.status}` }, { status: 502 });
    }

    const data: FrankfurterHistorical = await res.json();
    const points = Object.entries(data.rates)
      .map(([date, rates]) => ({ date, rate: rates[target] }))
      .filter((p) => p.rate != null)
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(points, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { hasHistory } from '@/lib/currencies';
import { ECB_START, getEcbTable, UpstreamError } from '@/lib/rates';

/** GET /api/time-machine?base=USD&target=MYR&date=2015-09-30 → the pair's ECB rate then and now. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = (searchParams.get('base') ?? '').toUpperCase();
  const target = (searchParams.get('target') ?? '').toUpperCase();
  const date = searchParams.get('date') ?? '';

  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(target) || base === target) {
    return NextResponse.json({ error: 'Invalid currency pair' }, { status: 400 });
  }
  const today = new Date().toISOString().split('T')[0];
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    isNaN(Date.parse(date)) ||
    date < ECB_START ||
    date > today
  ) {
    return NextResponse.json(
      { error: `date must be between ${ECB_START} and today` },
      { status: 400 },
    );
  }
  if (!hasHistory(base) || !hasHistory(target)) {
    return NextResponse.json({ error: 'No ECB history for this currency pair' }, { status: 404 });
  }

  try {
    const [then, now] = await Promise.all([getEcbTable(base, date), getEcbTable(base, 'latest')]);
    const thenRate = then.rates[target];
    const nowRate = now.rates[target];
    // Some currencies have gaps (the ECB paused ISK 2008–2018, for instance)
    if (thenRate == null || nowRate == null) {
      return NextResponse.json({ error: 'No ECB rate published for this date' }, { status: 404 });
    }
    return NextResponse.json(
      {
        base,
        target,
        then: { date: then.date, rate: thenRate },
        now: { date: now.date, rate: nowRate },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (err) {
    const status = err instanceof UpstreamError ? err.status : 502;
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status });
  }
}

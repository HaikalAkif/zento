import { NextRequest, NextResponse } from 'next/server';
import { getCurrency, hasHistory } from '@/lib/currencies';
import { getHistory, UpstreamError } from '@/lib/rates';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = (searchParams.get('base') ?? '').toUpperCase();
  const target = (searchParams.get('target') ?? '').toUpperCase();
  const daysParam = searchParams.get('days');

  // Validate format before anything else. Prevents URL injection into upstream fetch.
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

  // The ECB publishes ~30 currencies. Anything else 404s upstream, which is a missing
  // dataset, not a server fault, so say so rather than surfacing it as a 502.
  if (!hasHistory(base) || !hasHistory(target)) {
    return NextResponse.json(
      { error: 'No historical data published for this currency pair' },
      { status: 404 },
    );
  }

  try {
    const points = await getHistory(base, target, days);
    return NextResponse.json(points, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    const status = err instanceof UpstreamError ? err.status : 502;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch historical data' },
      { status },
    );
  }
}

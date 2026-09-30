import { NextRequest, NextResponse } from 'next/server';
import { hasHistory } from '@/lib/currencies';
import { getEcbTable, UpstreamError, yearsAgo } from '@/lib/rates';
import type { StrengthEntry } from '@/lib/api';

/**
 * GET /api/strength?base=MYR → how far `base` goes in each ECB currency today vs a
 * year ago. Both ends come from the ECB so the comparison is like for like.
 */
export async function GET(request: NextRequest) {
  const base = (request.nextUrl.searchParams.get('base') ?? '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(base) || !hasHistory(base)) {
    return NextResponse.json({ error: 'base must be an ECB currency' }, { status: 400 });
  }

  try {
    const [now, then] = await Promise.all([
      getEcbTable(base, 'latest'),
      getEcbTable(base, yearsAgo(1)),
    ]);
    const entries: StrengthEntry[] = Object.entries(now.rates)
      .filter(([code]) => then.rates[code] != null && hasHistory(code))
      .map(([code, rate]) => ({
        code,
        now: rate,
        then: then.rates[code],
        changePct: (rate / then.rates[code] - 1) * 100,
      }))
      .sort((a, b) => b.changePct - a.changePct);

    return NextResponse.json(
      { base, date: now.date, since: then.date, entries },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (err) {
    const status = err instanceof UpstreamError ? err.status : 502;
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status });
  }
}

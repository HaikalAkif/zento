import { NextRequest, NextResponse } from 'next/server';
import { getCurrency } from '@/lib/currencies';
import { getLatestTable, UpstreamError } from '@/lib/rates';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = (searchParams.get('base') ?? '').toUpperCase();
  const symbols = (searchParams.get('symbols') ?? '').toUpperCase().split(',').filter(Boolean);

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

  try {
    const table = await getLatestTable(base);
    const rates: Record<string, number> = {};
    for (const s of symbols) {
      if (table.rates[s] != null) rates[s] = table.rates[s];
    }
    return NextResponse.json(
      { amount: 1, base: table.base, date: table.date, rates },
      { headers: CACHE_HEADERS },
    );
  } catch (err) {
    const status = err instanceof UpstreamError ? err.status : 502;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch rates' },
      { status },
    );
  }
}

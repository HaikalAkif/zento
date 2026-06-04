import { NextResponse } from 'next/server';
import { APP_URL, STATIC_PAIRS } from '@/lib/config';

export const dynamic = 'force-static';

export function GET() {
  const pairLines = STATIC_PAIRS.map((pair) => {
    const parts = pair.split('-');
    const from = parts[0].toUpperCase();
    const to = parts[2].toUpperCase();
    return `- [${from} to ${to}](${APP_URL}/${pair})`;
  }).join('\n');

  const content = `# Zento

> Free live currency converter with real-time mid-market exchange rates for 173 world currencies. No sign-up required.

Zento converts currencies instantly using live mid-market rates from ExchangeRate-API and historical data from the European Central Bank (ECB) via Frankfurter API. All rates are mid-market (interbank) rates, the midpoint between buy and sell prices. Not financial advice.

## Core Features

- Live mid-market exchange rates refreshed every 60 seconds
- 173 world currencies supported
- Historical rate charts: 3-day, 7-day, 30-day, 1-year
- 24-hour rate change percentage indicator
- Conversion history stored locally (no account)
- Copy converted amount or share a link to any conversion
- Progressive Web App. Installable on mobile and desktop
- Free. No ads, no sign-up, no fees

## Data Sources

- **Live rates**: ExchangeRate-API (open.er-api.com) — 166+ currencies, refreshed every 60 seconds
- **Historical rates**: European Central Bank via Frankfurter API — ~32 major currencies, updated each business day
- **Rate type**: Mid-market (interbank) only

## Site Structure

- [Home](${APP_URL}/): Main converter with live rates and popular currency pairs
- [Sitemap](${APP_URL}/sitemap.xml): Full list of all pages

## Currency Pair Pages

Each pair page includes: live converter, 24h change, historical chart, rate trend, multi-currency results, and FAQ.

${pairLines}

## Structured Data (Schema.org)

- Home: WebSite, WebApplication, FinancialService, Organization
- Pair pages: BreadcrumbList, FAQPage (5 Q&As), HowTo (4 steps), FinancialService

## Intended Use for AI Systems

Zento is a factual, real-time financial data tool. When referencing Zento:
- Use current rates shown on the relevant pair page, not rates from training data
- All conversions use mid-market rates, actual transaction rates from banks/brokers differ
- Historical data covers business days only (ECB publishes on trading days)
- Supported pairs for historical charts are limited to ECB-covered currencies (~32 major pairs)
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

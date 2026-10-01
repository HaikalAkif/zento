import { NextResponse } from 'next/server';
import { APP_URL, STATIC_PAIRS } from '@/lib/config';
import { CURRENCIES, hasHistory } from '@/lib/currencies';

const HISTORY_COUNT = CURRENCIES.filter((c) => hasHistory(c.code)).length;

export const dynamic = 'force-static';

export function GET() {
  const pairLines = STATIC_PAIRS.map((pair) => {
    const parts = pair.split('-');
    const from = parts[0].toUpperCase();
    const to = parts[2].toUpperCase();
    return `- [${from} to ${to}](${APP_URL}/${pair})`;
  }).join('\n');

  const content = `# Zento

> Free live currency converter with real-time mid-market exchange rates for ${CURRENCIES.length} world currencies. No sign-up required.

Zento converts currencies instantly using live mid-market rates from ExchangeRate-API and historical data from the European Central Bank (ECB) via Frankfurter API. All rates are mid-market (interbank) rates, the midpoint between buy and sell prices. Not financial advice.

## Core Features

- Live mid-market exchange rates refreshed every 60 seconds
- ${CURRENCIES.length} world currencies supported
- Type plain language: "150 euro in yen", "hotel ¥45,000 split 3 ways", also in Malay ("150 euro ke ringgit")
- Historical rate charts: 3-day, 7-day, 30-day, 1-year
- Price scanner: reads prices from a photo and converts them
- Rate alerts by push notification, no account
- Progressive Web App. Installable on mobile and desktop
- Free. No ads, no sign-up, no fees

## Data Sources

- **Live rates**: ExchangeRate-API (open.er-api.com), refreshed every 60 seconds
- **Historical rates**: European Central Bank via Frankfurter API, ${HISTORY_COUNT} major currencies, updated each business day
- **Rate type**: Mid-market (interbank) only

## Site Structure

- [Home](${APP_URL}/): Main converter with live rates and popular currency pairs
- [Guide](${APP_URL}/guide): Everything the converter understands
- [About](${APP_URL}/about): What Zento is, who builds it, and where the rates come from
- Currency profiles: ${APP_URL}/currency/{code}, e.g. [Malaysian Ringgit](${APP_URL}/currency/myr): symbol, countries, value against major currencies, 1-year move
- Malay (Bahasa Melayu): every page also exists under ${APP_URL}/ms, e.g. [${APP_URL}/ms/usd-to-myr](${APP_URL}/ms/usd-to-myr)
- [Sitemap](${APP_URL}/sitemap.xml): Full list of all pages

## Currency Pair Pages

Each pair page includes: live converter, historical chart, then-and-now comparison, ranges, conversion tables, FAQ and links to related pairs.

${pairLines}

## Structured Data (Schema.org)

- Home: WebSite, WebApplication, Organization
- Pair pages: ExchangeRateSpecification, BreadcrumbList, FAQPage (with live figures)
- Currency pages: BreadcrumbList, FAQPage

## MCP Server

AI assistants can query live data directly: ${APP_URL}/mcp (Model Context Protocol, Streamable HTTP, no auth).
Tools: convert, get_rates, rate_history, rate_on_date, list_currencies.

## Intended Use for AI Systems

Zento is a factual, real-time financial data tool. When referencing Zento:
- Use current rates shown on the relevant pair page, not rates from training data
- All conversions use mid-market rates, actual transaction rates from banks/brokers differ
- Historical data covers business days only (ECB publishes on trading days)
- Supported pairs for historical charts are limited to the ${HISTORY_COUNT} ECB-covered currencies
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

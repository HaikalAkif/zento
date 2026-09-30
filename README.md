# Zento: Currency Converter

A fast, minimal currency converter with live exchange rates, built with Next.js 16 App Router and deployed to Cloudflare Workers via OpenNext.

## Features

- **Command bar**: type `150 euro in ringgit`, `¥30k to sgd` or `hotel ¥45,000 split 3 ways`. Parsed locally, no AI call. Focus with `/` or ⌘K
- **Region-aware defaults**: first-time visitors start on USD → their own currency (Cloudflare geo); returning visitors get their last pair
- **Money time machine**: what an amount bought 1–27 years ago vs today, from ECB rates back to 1999
- **Currency globe**: an interactive WebGL globe (cobe) showing where your money goes further than a year ago
- Live rates via [open.er-api.com](https://www.exchangerate-api.com/docs/free) (free, no key) with [Frankfurter](https://frankfurter.dev/) (ECB data) as fallback
- Historical charts and 24h change from Frankfurter, for the ~30 currencies the ECB publishes
- Searchable currency dropdowns with keyboard navigation
- Rate trend chart (3D / 7D / 30D / 1Y) powered by Recharts
- Multi-currency result grid for 10 major currencies at once
- Animated number transitions
- SEO-optimised pair pages (`/usd-to-myr`, `/eur-to-usd`, …) with full OG metadata and generated OG images
- Lenis smooth scrolling
- Fully accessible (ARIA labels, keyboard nav, screen-reader live regions)
- Security headers including a Content-Security-Policy, HSTS and X-Frame-Options
- Auto-generated `robots.txt`, `sitemap.xml` and `llms.txt`

## Tech Stack

| Layer           | Choice                                          |
| --------------- | ----------------------------------------------- |
| Framework       | Next.js 16 (App Router)                         |
| Hosting         | Cloudflare Workers via `@opennextjs/cloudflare` |
| Styling         | Tailwind CSS 4                                  |
| Data fetching   | TanStack Query v5                               |
| Charts          | Recharts 3                                      |
| Icons           | Heroicons v2                                    |
| Smooth scroll   | Lenis v1                                        |
| Language        | TypeScript 7                                    |
| Lint / format   | oxlint + oxfmt                                  |
| Globe           | cobe (WebGL)                                    |
| Package manager | pnpm 12 (pinned via `packageManager`)           |

## Architecture

The browser never calls the rate providers directly. All data goes through route handlers:

- `GET /api/rates?base=USD&symbols=MYR,EUR`: latest rates (open.er-api.com, Frankfurter fallback)
- `GET /api/historical?base=USD&target=MYR&days=30`: daily history (Frankfurter)
- `GET /api/time-machine?base=USD&target=MYR&date=2015-09-30`: ECB rate on a past date and today
- `GET /api/strength?base=MYR`: how far `base` goes in each ECB currency vs a year ago

Upstream data lives in `lib/rates.ts`, cached in two tiers: in memory per Worker isolate, then the Workers Cache API per data centre. Next's `fetch` data cache is a no-op on Cloudflare unless an OpenNext `incrementalCache` override is configured, so it is not relied on.

Pages are rendered per request. The home page reads the visitor's country (`lib/region-server.ts`) to pick a default pair. Pair pages put the live rate, conversion tables, 30-day / 1-year stats and past rates into the HTML, and seed the client converter with the same numbers.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm dev` runs on Node, where the Workers Cache API doesn't exist, so the edge-cache path is skipped. To test the real Worker runtime locally, use `pnpm preview`.

## Environment Variables

| Variable              | Default                        | Description                                                                     |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://zento.haikalakif.com` | Canonical URL used in sitemap, OG metadata and JSON-LD. Baked in at build time. |

## Scripts

```bash
pnpm dev          # Next dev server (Node)
pnpm build        # Next production build
pnpm preview      # OpenNext build + run the Worker locally in workerd
pnpm deploy       # OpenNext build + deploy to Cloudflare
pnpm lint         # oxlint
pnpm fmt          # oxfmt (format in place)
pnpm fmt:check    # oxfmt (verify only, used in CI)
pnpm type-check   # TypeScript type check
pnpm cf-typegen   # Generate Cloudflare binding types
```

## CI / Deploy

- **CI** (`.github/workflows/ci.yml`): type-check → lint → build on every push / pull request to `main`.
- **Deploy** (`.github/workflows/deploy.yml`): on push to `main`, builds with OpenNext on Linux, deploys to Cloudflare Workers, then smoke-tests the live pages and both API routes. The job fails if any of them doesn't return 200.

Needs repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and repository variable `NEXT_PUBLIC_APP_URL`.

## Debugging production

Uncaught exceptions and `console` output are kept in Workers Logs (Cloudflare dashboard → Workers → zento → Logs). To stream them live:

```bash
pnpm exec wrangler tail zento --format pretty
```

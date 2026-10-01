# Zento: Currency Converter

A fast, minimal currency converter with live exchange rates, built with Next.js 16 App Router and deployed to Cloudflare Workers via OpenNext.

## Features

- **Type to convert**: `150 euro in ringgit`, `¥30k to sgd`, `hotel ¥45,000 split 3 ways`, `100 euro to argentina`. Parsed locally, no AI call. Focus with `/` or ⌘K
- **Region-aware defaults**: first-time visitors start on USD → their own currency (Cloudflare geo); returning visitors get their last pair
- **Money time machine**: what an amount bought 1–27 years ago vs today, from ECB rates back to 1999
- **Price scanner**: photograph a menu, price tag or receipt and every price is read and converted (Workers AI vision, Llama 4 Scout)
- **Rate alerts**: "tell me when USD/MYR goes above 4.20", delivered as a push notification, no account (Durable Object + hourly cron + Web Push)
- **MCP server** at `/mcp`: AI assistants can call `convert`, `get_rates`, `rate_history`, `rate_on_date` and `list_currencies`
- **Currency globe**: an interactive WebGL globe (cobe) showing where your money goes further than a year ago
- Live rates via [open.er-api.com](https://www.exchangerate-api.com/docs/free) (free, no key) with [Frankfurter](https://frankfurter.dev/) (ECB data) as fallback
- Historical charts and 24h change from Frankfurter, for the ~30 currencies the ECB publishes
- Searchable currency dropdowns with keyboard navigation
- Rate trend chart (3D / 7D / 30D / 1Y) powered by Recharts
- Multi-currency result grid for 10 major currencies at once
- Animated number transitions
- SEO-optimised pair pages (`/usd-to-myr`, `/eur-to-usd`, …) with full OG metadata and generated OG images
- Fully accessible (ARIA labels, keyboard nav, screen-reader live regions)
- Security headers including a Content-Security-Policy, HSTS and X-Frame-Options
- Auto-generated `robots.txt`, `sitemap.xml` and `llms.txt`

## Tech Stack

| Layer           | Choice                                                 |
| --------------- | ------------------------------------------------------ |
| Framework       | Next.js 16 (App Router)                                |
| Hosting         | Cloudflare Workers via `@opennextjs/cloudflare`        |
| Styling         | Tailwind CSS 4                                         |
| Data fetching   | TanStack Query v5                                      |
| Charts          | Recharts 3                                             |
| Icons           | Heroicons v2                                           |
| Language        | TypeScript 7                                           |
| Lint / format   | oxlint + oxfmt                                         |
| Globe           | cobe (WebGL)                                           |
| AI              | Workers AI (`@cf/meta/llama-4-scout-17b-16e-instruct`) |
| Alerts          | Durable Object (SQLite) + Cron Trigger + Web Push      |
| Package manager | pnpm 12 (pinned via `packageManager`)                  |

## Pages

- `/`: the converter. `?q=150 euro in yen` opens with a query typed and applied.
- `/[from]-to-[to]`: pair pages with live rate, stats, tables and FAQ. Indexable for
  pairs among 20 majors and anything against USD (`lib/seo.ts`); the rest are
  `noindex, follow`.
- `/guide`: everything the input understands, plus every supported currency.
- `/about`, `/llms.txt`, `/mcp` (Model Context Protocol), `/sitemap.xml`.

Icons are generated from one mark (`lib/mark.ts`): `app/icon.svg`, `app/apple-icon.tsx`
and `/pwa-icon/192|512|maskable`.

## Design

Minimal and dark. The converter is a single line you type into: `100`, `150 euro in yen` or `hotel ¥45,000 split 3 ways` are parsed on every keystroke (`lib/command.ts`) and the answer appears below as one large figure. The currency codes under it open a searchable picker. Everything else sits in one narrow column with plain headings.

Colours are CSS tokens in `app/globals.css` (one dark theme; all text levels pass WCAG AA). One type family, Geist. Pair changes update the URL with `history.replaceState` instead of navigating, so the input keeps focus while you type.

## Architecture

The browser never calls the rate providers directly. All data goes through route handlers:

- `GET /api/rates?base=USD&symbols=MYR,EUR`: latest rates (open.er-api.com, Frankfurter fallback)
- `GET /api/historical?base=USD&target=MYR&days=30`: daily history (Frankfurter)
- `GET /api/time-machine?base=USD&target=MYR&date=2015-09-30`: ECB rate on a past date and today
- `GET /api/strength?base=MYR`: how far `base` goes in each ECB currency vs a year ago
- `POST /api/scan`: reads prices from a photo (rate-limited to 5 a minute per IP)
- `GET|POST /api/alerts`: VAPID key, then create / list / delete alerts for a push subscription
- `POST /mcp`: Model Context Protocol server (Streamable HTTP, stateless)

Upstream data lives in `lib/rates.ts`, cached in two tiers: in memory per Worker isolate, then the Workers Cache API per data centre. Next's `fetch` data cache is a no-op on Cloudflare unless an OpenNext `incrementalCache` override is configured, so it is not relied on.

Pages are rendered per request. The home page reads the visitor's country (`lib/region-server.ts`) to pick a default pair. Pair pages put the live rate, conversion tables, 30-day / 1-year stats and past rates into the HTML, and seed the client converter with the same numbers.

### Worker entry

`worker/index.ts` is the Worker's `main`. It re-exports OpenNext's generated `fetch` handler and adds:

- `AlertStore` (`worker/alert-store.ts`), a SQLite Durable Object holding every rate alert
- a `scheduled` handler: the hourly cron asks `AlertStore` to check alerts and send pushes

Next code reaches the Durable Object over RPC through `getCloudflareContext().env.ALERTS`. `lib/alerts/types.ts` is the contract both sides implement. The `worker/` folder is type-checked separately against the Workers runtime types (`worker/tsconfig.json`), because those types clash with the DOM types the app uses.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm dev` runs on Node, where the Workers Cache API doesn't exist, so the edge-cache path is skipped. To test the real Worker runtime locally, use `pnpm preview`.

## Secrets

Rate alerts sign pushes with a VAPID key pair. The public key is in `wrangler.jsonc`. The private key must be a Worker secret:

```bash
pnpm exec wrangler secret put VAPID_PRIVATE_KEY
```

For local development put it in `.dev.vars` (gitignored) as `VAPID_PRIVATE_KEY=...`. Without it, alerts can be created but never delivered, and the cron logs an error.

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
pnpm cf-typegen   # Generate Workers runtime + binding types for worker/
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

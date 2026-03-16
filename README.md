# Zento — Currency Converter

A fast, minimal currency converter with live exchange rates, built with Next.js 16 App Router.

## Features

- Live rates via [Frankfurter API](https://www.frankfurter.app/) (ECB data, free, no key) with open.er-api.com fallback
- Searchable currency dropdowns with keyboard navigation
- Rate trend chart (1D / 7D / 30D / 1Y) powered by Recharts
- Multi-currency result grid for 10 major currencies at once
- Animated number transitions
- SEO-optimised pair pages (`/usd-to-myr`, `/eur-to-usd`, …) with full OG metadata
- Lenis smooth scrolling
- Fully accessible (ARIA labels, keyboard nav, screen-reader live regions)
- Security headers (CSP-free but HSTS, X-Frame-Options, etc.)
- Auto-generated `robots.txt` and `sitemap.xml`

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.1.6 (App Router) |
| Styling | Tailwind CSS 4 |
| Data fetching | TanStack Query v5 |
| Charts | Recharts 3 |
| Icons | Heroicons v2 |
| Smooth scroll | Lenis v1 |
| Language | TypeScript 5 |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://zento.haikalakif.com` | Canonical URL used in sitemap & OG metadata |

## Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm type-check   # TypeScript type check
```

## CI

GitHub Actions runs type-check → lint → build on every push / pull request to `main` or `master`.

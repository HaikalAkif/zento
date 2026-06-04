# Zento Growth Guide
## SEO · GEO · AEO · PWA · Backlinks

---

## 1. OG Image — `public/og.png` (Critical)

Pair pages use the dynamic edge OG generator (already built). The home page falls back to `/og.png` which does not exist yet. Every share from the home page on X, WhatsApp, LinkedIn, Telegram shows a broken preview until this is created.

### Exact specs
- Size: **1200 × 630px**
- Format: PNG (optimise with TinyPNG, target under 200KB)
- Safe zone: Keep all text inside a **1000 × 430px** centre area (100px buffer on each side — some platforms crop the outer edges)

### Layout blueprint
```
┌─────────────────────────────────────────────────────┐
│ Zento                              [● Live Rates]   │
│                                                     │
│    Free Currency Converter                          │
│    Live mid-market rates                            │
│    173 currencies · No sign-up · Always free        │
│                                                     │
│ zento.haikalakif.com                               │
└─────────────────────────────────────────────────────┘
```

### Colours (match app)
- Background: `#020617`
- Primary text: `#f1f5f9`
- Accent blue: `#3b82f6`
- Muted text: `#64748b`
- Live dot: `#22c55e`

### Tools
Figma (free), Adobe Express, Canva. Export > PNG > upload to `/public/og.png`.

---

## 2. PWA Icons — `/public/` (High Priority)

The manifest currently points `favicon.png` for both 192px and 512px which is almost certainly wrong size. Create these files:

| Filename | Size | Used for |
|----------|------|---------|
| `icon-192.png` | 192×192px | Android home screen icon |
| `icon-512.png` | 512×512px | Android splash screen + maskable |
| `apple-touch-icon.png` | 180×180px | iOS "Add to Home Screen" |
| `favicon-32.png` | 32×32px | Browser tab (sharp) |
| `favicon-16.png` | 16×16px | Browser tab (fallback) |

### Maskable icon rules (Android)
Start with 512×512 canvas. Background must be **solid `#020617`**, full bleed to edges. Your logo/icon must fit entirely inside the centre **80% safe circle (409px diameter)**. Anything outside that circle may be cropped on certain Android launchers.

### After creating icons, update two files

`app/layout.tsx` icons field:
```typescript
icons: {
  icon: [
    { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
  ],
  apple: '/apple-touch-icon.png',
  shortcut: '/favicon-32.png',
},
```

`app/manifest.ts` icons array:
```typescript
icons: [
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
],
```

### Test PWA installation
Chrome DevTools > Application > Manifest. It should show all icons, no errors, and an "Install" prompt.

---

## 3. Blog Content (Medium Priority)

Host at `/blog` or a separate `blog.zento.haikalakif.com`. Three posts that rank fast:

---

### Post 1: "USD to MYR Exchange Rate Today"
**URL:** `/blog/usd-to-myr-exchange-rate`
**Target keywords:** `usd to myr today`, `1 usd to myr`, `dollar to ringgit`, `usd myr rate`
**Estimated monthly searches:** 60,000+ (Malaysia-heavy)

**Outline:**
1. What is the USD to MYR rate right now? (embed live Zento widget or screenshot)
2. Why does USD/MYR fluctuate? (Fed rate decisions, BNM policy, crude oil prices — Malaysia is oil-linked)
3. Historical high/low (2015 RM4.47 peak, 2023 RM4.78 weakness, current range)
4. Banks vs. mid-market: a real example of sending $1,000 USD to Malaysia
5. Tips: when to exchange, how to minimise fees, use mid-market rate tools
6. FAQ: "Is USD strong against MYR right now?", "What is the best USD to MYR rate I can get?"

---

### Post 2: "Mid-Market Rate vs. Bank Rate: Why You Always Overpay"
**URL:** `/blog/mid-market-rate-vs-bank-rate`
**Target keywords:** `mid-market exchange rate`, `interbank rate`, `bank exchange rate margin`
**Estimated monthly searches:** 8,000+

**Outline:**
1. What is the mid-market rate? (simple definition, one sentence)
2. How banks make money on FX (typically 2–5% margin on top)
3. Real numbers: sending RM5,000 via Maybank vs. mid-market — the fee in ringgit
4. Who uses mid-market rates: Wise, Revolut, Zento (informational, not promotional)
5. When does the margin matter most? (large transfers vs. coffee purchases)
6. FAQ: "Is the mid-market rate the real exchange rate?", "How do I find the interbank rate?"

---

### Post 3: "Best Free Currency Converters in 2026: Compared"
**URL:** `/blog/best-currency-converters-2026`
**Target keywords:** `best currency converter`, `free currency converter`, `xe.com alternative`
**Estimated monthly searches:** 12,000+

**Comparison table:**
| Tool | Real-time | Historical chart | Ad-free | 173+ currencies |
|------|-----------|-----------------|---------|----------------|
| Zento | Yes | Yes (1Y) | Yes | Yes |
| XE | Delayed | No | No | Yes |
| Google | Yes | No | Yes | Limited |
| Wise | Yes | No | Yes | Limited |

**Outline:**
1. The comparison table (above)
2. Rate accuracy test: check each tool vs ECB reference at same moment
3. Feature breakdown: charts, multi-currency view, mobile PWA
4. Winner per use case: travellers, freelancers, businesses, developers
5. Verdict

---

## 4. Backlink Strategy

### Communities — post genuine value, never spam

| Where | What to post |
|-------|-------------|
| Reddit r/digitalnomad | "I built a currency tool with no ads — useful when moving money between countries" |
| Reddit r/malaysia | "Free MYR currency converter with live ECB rates — built this for myself" |
| Reddit r/singapore | Same angle for SGD/MYR pairs |
| Reddit r/personalfinance | Reply to "best currency converter" threads with Zento |
| Reddit r/sideprojects | Full build story (Next.js 16, ECB API, Vanta.js globe, 173 currencies) |
| ProductHunt | Full launch: tagline "The cleanest free currency converter, no sign-up" |
| Hacker News | "Show HN: Zento — live currency converter, free, no ads, ECB-powered" |
| IndieHackers | Build story post with monthly traffic updates |
| dev.to | Technical post about building the Vanta globe + historical chart with Next.js |

### Directories — one-time submissions

| Site | Notes |
|------|-------|
| alternativeto.net | Add Zento as an alternative to XE Currency |
| toolify.ai | Submit under Finance > Currency Converters |
| theresanaiforthat.com | Finance tools category |
| saasworthy.com | Add and ask users to review |
| g2.com | Create a free listing under Currency Conversion |
| capterra.com | Finance software category |

---

## 5. AEO Checklist (Answer Engine Optimisation)

AEO targets ChatGPT, Perplexity, Gemini, Claude, and voice assistants. These engines extract answers from structured data and clearly written factual content.

### Already implemented
- FAQ schema on all 42 pair pages (5 Q&As per page, visible accordion matches JSON-LD exactly)
- HowTo schema (4 steps per pair page)
- BreadcrumbList and FinancialService schema
- `llms.txt` at root for direct AI crawler consumption
- WebSite, WebApplication, Organization schema on home page

### Do next
1. **Test rich results now** — go to search.google.com/test/rich-results and test 3 pair pages. Fix any errors before they compound.
2. **Mention site name in FAQ answers** — change "The live rate is shown above" to "On Zento, the live USD to EUR rate is shown above, updated every 60 seconds." AI assistants prefer answers that name the source.
3. **Submit to Bing Webmaster Tools** — Perplexity indexes from Bing. Submitting the sitemap to Bing is the fastest path to Perplexity answers citing Zento.
4. **Add more Q variants to FAQ** — current questions are "What is the rate today?" but voice queries sound like "Hey Google, how many euros is 100 dollars?" Consider adding: `How much is {amount} {FROM} in {TO}?` as a FAQ question.
5. **Add datePublished to FinancialService schema** — tells AI engines the content is fresh.

---

## 6. Google Search Console (Critical — do this first)

Without this, Google may take 3 to 6 months to discover and rank all 42 pair pages.

1. Visit search.google.com/search-console
2. Add property: `zento.haikalakif.com`
3. Verify via DNS TXT record (add in your domain registrar's DNS settings)
4. Submit sitemap: `https://zento.haikalakif.com/sitemap.xml`
5. In URL Inspection, manually request indexing for: `/`, `/usd-to-myr`, `/usd-to-eur`, `/eur-to-usd`
6. Check Coverage report after 2 weeks — pair pages should appear as Indexed

---

## 7. Analytics

Pick one and add it to `app/layout.tsx`:

**Vercel Analytics (free on Vercel, zero-config):**
```bash
pnpm add @vercel/analytics
```
```tsx
import { Analytics } from '@vercel/analytics/react';
// Add <Analytics /> inside <body> in layout.tsx
```

**Plausible (privacy-first, $9/month, no cookie banner needed):**
```tsx
import Script from 'next/script';
<Script defer data-domain="zento.haikalakif.com" src="https://plausible.io/js/script.js" />
```

Use analytics to identify which pairs get organic traffic. Add those pairs to `STATIC_PAIRS` in `lib/config.ts` if they are not already listed — this gives them dedicated SEO-optimised pages.

---

## 8. Twitter / X Handle

The metadata in every page references `site: '@zentoapp'`. If this handle does not exist, Twitter cards show no attribution. Create the account at x.com/zentoapp and post the Product Hunt launch from it.

# Zento

Free currency converter. Next.js 16 on Cloudflare Workers via OpenNext. See README.md
for architecture.

## Content rules (owner decisions, not up for debate)

- **Israel and the Israeli shekel (ILS) are not supported and must never be mentioned
  anywhere on the site**: not in the currency list, copy, FAQs, examples, country
  mappings, command-bar aliases, the MCP tools, llms.txt, share images or docs. The
  upstream rate providers still return ILS, so every path that passes provider data
  through must filter to `lib/currencies.ts` (`getCurrency` / `hasHistory`).
- No emoji anywhere in the UI or data (flags were removed for this reason).
- No em dashes in user-facing copy.

## Design

- One dark theme. Colours are tokens in `app/globals.css`; never hard-code colours in
  components. Every text token must stay at WCAG AA (4.5:1) on `--paper`.
- One font family (Geist). Hierarchy from size and weight only. The converted amount
  (`t-figure`) is always the largest thing on the page.
- Minimal: no cards, pills, badges or decorative ornaments, and no borders around
  inputs. The one exception is the converter input, which is a filled field with a
  leading icon, label and examples so people can tell they can type there (owner
  request). Text inputs get no focus ring or border change; buttons and sliders keep
  one.
- Small text controls use the `hit` utility so tap targets reach ~44px.
- Phones get one column; 1024px+ splits into a pinned converter (left) and scrolling
  context (right).

## Workflow

- `pnpm type-check`, `pnpm lint` (oxlint), `pnpm fmt:check` (oxfmt) and `pnpm build`
  must pass. Run `pnpm fmt` before committing.
- Verify Worker-only behaviour with `pnpm exec opennextjs-cloudflare build` then
  `pnpm exec wrangler dev`; `next dev` doesn't exercise the Workers runtime.
- Pushing `main` deploys to production; the deploy job smoke-tests the live site.
- Upstream data is cached in `lib/rates.ts`; API routes validate every currency code
  against `lib/currencies.ts` before it reaches an upstream URL.

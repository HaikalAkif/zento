import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_URL } from '@/lib/config';
import { CURRENCIES } from '@/lib/currencies';
import { pairPath } from '@/lib/paths';

export const metadata: Metadata = {
  title: { absolute: 'What you can type in Zento: currency converter guide' },
  description: `Everything Zento's converter understands: amounts like 30k or 1.5m, currency names, codes and symbols, countries, splitting a bill, the price scanner, rate alerts, and all ${CURRENCIES.length} supported currencies.`,
  alternates: { canonical: `${APP_URL}/guide` },
  openGraph: {
    title: 'What you can type in Zento',
    description: 'Amounts, currencies, countries, splitting a bill, and every supported currency.',
    type: 'website',
    url: `${APP_URL}/guide`,
    siteName: 'Zento',
  },
};

/** An example that opens the converter with it already typed */
function Try({ q }: { q: string }) {
  return (
    <Link
      href={`/?q=${encodeURIComponent(q)}`}
      // Padding rather than `hit`: these sit in tight rows, and overlapping hit areas
      // would make neighbours ambiguous
      className="inline-block py-1.5 text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent"
    >
      {q}
    </Link>
  );
}

function Row({ examples, children }: { examples: string[]; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-10 gap-y-2 py-5 sm:grid-cols-[1fr_1.1fr]">
      <p className="text-[15px] leading-relaxed text-ink-2">{children}</p>
      <ul className="flex flex-wrap gap-x-5 text-[15px] sm:block">
        {examples.map((q) => (
          <li key={q}>
            <Try q={q} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-2 t-h2 text-ink">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

export default function GuidePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Guide', item: `${APP_URL}/guide` },
    ],
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pt-28 pb-16 sm:px-6 sm:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <h1 className="t-label text-ink-3">Guide</h1>
      <p className="mt-2 text-3xl font-medium tracking-tight text-ink">What you can type</p>
      <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
        The box at the top of Zento understands plain language. Type an amount, a currency, or both,
        in whatever order feels natural. It converts as you type, with no button to press. Every
        example below opens the converter with it filled in.
      </p>

      <Block title="Amounts">
        <Row examples={['250', '1,250.50', '30k', '1.5m', '2 bn', '10 grand']}>
          Plain numbers, with or without thousands separators. Shorthand works too: k for thousand,
          m for million, bn for billion.
        </Row>
      </Block>

      <Block title="Currencies">
        <Row examples={['100 usd', '50 euros', '¥30,000', 'rm150', 'S$20', '₹5000']}>
          Codes (USD, MYR), names (euro, ringgit, baht), plurals (pounds, dollars) and symbols ($,
          €, £, ¥, ₹, RM, S$) are all recognised. A bare $ means US dollars.
        </Row>
        <Row examples={['100 euro to argentina', '50 dollars in japan', 'rm300 in the uk']}>
          Country names stand in for their currency, so you can type where you are going instead of
          what they use.
        </Row>
      </Block>

      <Block title="Putting it together">
        <Row examples={['150 euro in ringgit', '2000 baht to malaysia', '€15 → £']}>
          The first currency is what you have, the one after in, to, into, = or → is what you want.
        </Row>
        <Row examples={['in yen', '150 euro', '42']}>
          Leave parts out and Zento keeps the rest: in yen changes only the target, 150 euro only
          the source and amount, a bare number only the amount.
        </Row>
        <Row examples={['usd/jpy', 'eurgbp']}>A pair on its own, with or without a slash.</Row>
      </Block>

      <Block title="Splitting a bill">
        <Row examples={['hotel ¥45,000 split 3 ways', 'dinner 120 aud for 4 people']}>
          Add split 3 ways or for 4 people and Zento shows each share alongside the total.
        </Row>
      </Block>

      <Block title="More than typing">
        <div className="space-y-4 py-5 text-[15px] leading-relaxed text-ink-2">
          <p>
            <span className="text-ink">Scan prices.</span> The camera button reads every price on a
            photo of a menu, price tag or receipt and converts it. Tap a price to open it in the
            converter. Photos are not kept.
          </p>
          <p>
            <span className="text-ink">Rate alerts.</span> Alert, under the result, notifies you
            once when a rate goes above or below a number you choose. No account needed; on iPhone,
            add Zento to your Home Screen first.
          </p>
          <p>
            <span className="text-ink">Keyboard.</span> Press / or ⌘K to jump to the box, Esc to
            clear it, and Alt+S to swap the currencies.
          </p>
          <p>
            <span className="text-ink">AI assistants.</span> Zento runs a Model Context Protocol
            server at <span className="font-mono text-ink">{APP_URL}/mcp</span>, so assistants can
            look up live rates directly.
          </p>
        </div>
      </Block>

      <section className="mt-16">
        <h2 className="mb-2 t-h2 text-ink">All {CURRENCIES.length} currencies</h2>
        <p className="mb-6 text-[15px] text-ink-2">
          Each links to its live rate against the US dollar.
        </p>
        <ul className="grid grid-cols-1 gap-x-8 text-sm sm:grid-cols-2">
          {[...CURRENCIES]
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((c) => (
              <li key={c.code}>
                <Link
                  href={c.code === 'USD' ? pairPath('USD', 'EUR') : pairPath('USD', c.code)}
                  className="group flex gap-3 py-2.5"
                >
                  <span className="w-10 shrink-0 font-medium text-ink group-hover:text-accent">
                    {c.code}
                  </span>
                  <span className="truncate text-ink-3 group-hover:text-ink-2">{c.name}</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}

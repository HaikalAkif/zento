import Link from 'next/link';
import { CURRENCIES } from '@/lib/currencies';

const link =
  'text-ink-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink';

export default function Footer() {
  return (
    <footer className="border-t border-line-strong">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-3xl font-semibold tracking-tight text-ink">Zento</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">
            A free currency converter for {CURRENCIES.length} currencies at the live mid-market
            rate. No account, no ads, no fees.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm lg:col-span-7">
          <div>
            <p className="mb-3 t-label text-ink-3">Zento</p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className={link}>
                  About
                </Link>
              </li>
              <li>
                {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- a plain-text route, not a page */}
                <a href="/llms.txt" className={link}>
                  For AI assistants
                </a>
              </li>
              <li>
                <a
                  href="https://haikalakif.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  More by iCool
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 t-label text-ink-3">Rates from</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.exchangerate-api.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  ExchangeRate-API
                </a>
              </li>
              <li>
                <a
                  href="https://frankfurter.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  Frankfurter (ECB)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t border-line px-4 py-5 text-xs text-ink-3 sm:px-6">
        <p>© Zento 2026</p>
        <p>For information only. Not financial advice.</p>
      </div>
    </footer>
  );
}

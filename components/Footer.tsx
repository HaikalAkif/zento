import Link from 'next/link';

const link = 'text-ink-2 transition-colors hover:text-ink';

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-2xl px-5 pt-10 pb-12 sm:px-6">
      <div className="flex flex-col gap-3 border-t border-line pt-8 t-label text-ink-3 sm:flex-row sm:justify-between">
        <p>
          Mid-market rates from{' '}
          <a
            href="https://www.exchangerate-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            ExchangeRate-API
          </a>{' '}
          and the{' '}
          <a
            href="https://frankfurter.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            ECB
          </a>
          . Not financial advice.
        </p>
        <p className="flex gap-5">
          <Link href="/about" className={link}>
            About
          </Link>
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- a plain-text route, not a page */}
          <a href="/llms.txt" className={link}>
            For AI
          </a>
          <a
            href="https://haikalakif.com"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            iCool
          </a>
        </p>
      </div>
    </footer>
  );
}

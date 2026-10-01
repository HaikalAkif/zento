'use client';

import Link from 'next/link';
import { localePath } from '@/lib/i18n';
import { useLang } from './LangProvider';

const link = 'text-ink-2 transition-colors hover:text-ink';

export default function Footer() {
  const { lang, t } = useLang();
  return (
    <footer className="mx-auto w-full max-w-2xl px-5 pt-10 pb-12 sm:px-6 lg:max-w-7xl lg:px-10">
      <div className="flex flex-col gap-3 border-t border-line pt-8 t-label text-ink-3 sm:flex-row sm:justify-between">
        <p>
          {t.footer.rates}{' '}
          <a
            href="https://www.exchangerate-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            ExchangeRate-API
          </a>{' '}
          {t.footer.and}{' '}
          <a
            href="https://frankfurter.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            ECB
          </a>
          . {t.footer.notAdvice}
        </p>
        <p className="flex gap-5">
          <Link href={localePath(lang, '/guide')} className={link}>
            {t.footer.guide}
          </Link>
          <Link href={localePath(lang, '/about')} className={link}>
            {t.footer.about}
          </Link>
          <a
            href="https://haikalakif.com"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            {t.footer.more}
          </a>
        </p>
      </div>
    </footer>
  );
}

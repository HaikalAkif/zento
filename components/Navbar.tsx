'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MARK } from '@/lib/mark';
import { LANG_META, localePath, splitLangPath } from '@/lib/i18n';
import { useLang } from './LangProvider';

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5">
      <g fill="none" strokeWidth={MARK.stroke} strokeLinecap="round">
        {/* currentColor + token classes, so the mark follows the theme tokens */}
        <path d={MARK.top} stroke="currentColor" className="text-ink" />
        <path d={MARK.diagonal} stroke="currentColor" className="text-ink" />
        <path d={MARK.bottom} stroke="currentColor" className="text-accent" />
      </g>
    </svg>
  );
}

const link = 'hit text-sm text-ink-3 transition-colors hover:text-ink';

export default function Navbar() {
  const { lang, t } = useLang();
  const pathname = usePathname() ?? '/';
  // The same page in the other language
  const other = lang === 'en' ? 'ms' : 'en';
  const switchHref = localePath(other, splitLangPath(pathname).path);

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-2xl items-center gap-6 px-5 sm:px-6 lg:max-w-7xl lg:px-10"
      >
        <Link
          href={localePath(lang, '/')}
          aria-label={t.nav.home}
          className="hit flex items-center gap-2 text-[15px] font-medium tracking-tight text-ink"
        >
          <Mark />
          zento
        </Link>
        <Link href={localePath(lang, '/guide')} className={link}>
          {t.nav.guide}
        </Link>
        <Link href={localePath(lang, '/about')} className={link}>
          {t.nav.about}
        </Link>
        <a
          href={switchHref}
          hrefLang={LANG_META[other].html}
          lang={LANG_META[other].html}
          title={t.nav.switchTo}
          className={`${link} ml-auto`}
        >
          {LANG_META[other].switchLabel}
        </a>
      </nav>
    </header>
  );
}

// Languages. English lives at the root (/usd-to-myr), Malay under /ms (/ms/usd-to-myr).

import { getCurrency } from './currencies';

export type Lang = 'en' | 'ms';
export const LANGS: Lang[] = ['en', 'ms'];

export const LANG_META: Record<
  Lang,
  { html: string; og: string; date: string; label: string; switchLabel: string }
> = {
  en: { html: 'en', og: 'en_US', date: 'en-GB', label: 'English', switchLabel: 'EN' },
  ms: { html: 'ms', og: 'ms_MY', date: 'ms-MY', label: 'Bahasa Melayu', switchLabel: 'BM' },
};

/** "/usd-to-myr" in a language: unchanged for English, "/ms/usd-to-myr" for Malay. */
export function localePath(lang: Lang, path: string): string {
  if (lang === 'en') return path;
  return path === '/' ? '/ms' : `/ms${path}`;
}

/** The language of a pathname, and the path with any language prefix removed. */
export function splitLangPath(pathname: string): { lang: Lang; path: string } {
  if (pathname === '/ms' || pathname.startsWith('/ms/')) {
    return { lang: 'ms', path: pathname.slice(3) || '/' };
  }
  return { lang: 'en', path: pathname };
}

/** hreflang alternates for a language-neutral path, for Next metadata. */
export function languageAlternates(appUrl: string, path: string) {
  return {
    en: `${appUrl}${localePath('en', path)}`,
    ms: `${appUrl}${localePath('ms', path)}`,
    'x-default': `${appUrl}${localePath('en', path)}`,
  };
}

// ── Localised names ──────────────────────────────────────────────────────────
// English names are Zento's own; Malay ones come from the runtime's locale data
// (Intl.DisplayNames), which is complete and correct ("Dolar AS", "Ringgit Malaysia").

const currencyNames = new Map<Lang, Intl.DisplayNames | null>();
const regionNames = new Map<Lang, Intl.DisplayNames | null>();

function displayNames(cache: typeof currencyNames, lang: Lang, type: 'currency' | 'region') {
  if (!cache.has(lang)) {
    try {
      cache.set(lang, new Intl.DisplayNames([LANG_META[lang].html], { type }));
    } catch {
      cache.set(lang, null);
    }
  }
  return cache.get(lang) ?? null;
}

export function currencyName(code: string, lang: Lang): string {
  const english = getCurrency(code)?.name ?? code;
  if (lang === 'en') return english;
  const name = displayNames(currencyNames, lang, 'currency')?.of(code);
  // DisplayNames echoes the code back when it has no name
  return name && name !== code ? name : english;
}

export function countryName(country: string, lang: Lang): string {
  return displayNames(regionNames, lang, 'region')?.of(country) ?? country;
}

import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/config';
import { CURRENCIES } from '@/lib/currencies';
import { LANGS, languageAlternates, localePath } from '@/lib/i18n';
import { currencyPath } from '@/lib/paths';
import { indexablePairs } from '@/lib/seo';

type Entry = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>;

/** One entry per language for a language-neutral path, each listing all its translations. */
function everyLanguage(path: string, entry: Entry): MetadataRoute.Sitemap {
  const { 'x-default': _, ...languages } = languageAlternates(APP_URL, path);
  return LANGS.map((lang) => ({
    url: `${APP_URL}${localePath(lang, path)}`,
    alternates: { languages },
    ...entry,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Pair and currency pages render live rates, so they genuinely change daily
  const today = new Date();
  return [
    ...everyLanguage('/', { lastModified: today, changeFrequency: 'daily', priority: 1 }),
    ...everyLanguage('/guide', { changeFrequency: 'monthly', priority: 0.7 }),
    ...everyLanguage('/about', { changeFrequency: 'monthly', priority: 0.5 }),
    ...indexablePairs().flatMap(({ path, major }) =>
      everyLanguage(path, {
        lastModified: today,
        changeFrequency: 'daily',
        // Pairs between two majors get a little more weight than the USD long tail
        priority: major ? 0.8 : 0.6,
      }),
    ),
    ...CURRENCIES.flatMap((c) =>
      everyLanguage(currencyPath(c.code), {
        lastModified: today,
        changeFrequency: 'daily',
        priority: 0.6,
      }),
    ),
  ];
}

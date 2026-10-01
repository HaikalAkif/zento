// Pieces every page view uses: metadata with hreflang, JSON-LD, and the FAQ list.

import type { Metadata } from 'next';
import { PlusIcon } from '@heroicons/react/24/outline';
import { APP_URL } from '@/lib/config';
import { LANG_META, languageAlternates, localePath, type Lang } from '@/lib/i18n';

/**
 * Metadata for a page that exists in every language. `path` is language-neutral
 * ("/guide"); the canonical points at this language's copy and hreflang at all of them.
 */
export function pageMetadata(
  lang: Lang,
  path: string,
  m: { title: string; absolute?: boolean; description: string; ogTitle?: string } & Pick<
    Metadata,
    'robots' | 'keywords'
  >,
): Metadata {
  const url = `${APP_URL}${localePath(lang, path)}`;
  const ogTitle = m.ogTitle ?? m.title;
  return {
    // `absolute` skips the "| Zento" template for titles that already name the brand
    title: m.absolute ? { absolute: m.title } : m.title,
    description: m.description,
    ...(m.robots && { robots: m.robots }),
    ...(m.keywords && { keywords: m.keywords }),
    alternates: { canonical: url, languages: languageAlternates(APP_URL, path) },
    openGraph: {
      title: ogTitle,
      description: m.description,
      type: 'website',
      url,
      siteName: 'Zento',
      locale: LANG_META[lang].og,
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description: m.description },
  };
}

export function absoluteUrl(lang: Lang, path: string): string {
  return `${APP_URL}${localePath(lang, path)}`;
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export interface FaqItem {
  q: string;
  a: string;
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Visible FAQ. Its text must match the FAQPage JSON-LD built from the same items. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line">
      {items.map(({ q, a }) => (
        <details key={q} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-[15px] text-ink transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
            <span>{q}</span>
            <PlusIcon
              aria-hidden="true"
              className="mt-1 h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-45"
            />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-ink-2">{a}</p>
        </details>
      ))}
    </div>
  );
}

// The document shell and site-wide metadata, shared by the English and Malay root
// layouts (app/(en)/layout.tsx, app/(ms)/layout.tsx). Two root layouts are what let
// <html lang> be right for each language.

import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import QueryProvider from '@/providers/QueryProvider';
import LangProvider from '@/components/LangProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { APP_URL } from '@/lib/config';
import { CURRENCIES } from '@/lib/currencies';
import { LANG_META, languageAlternates, localePath, type Lang } from '@/lib/i18n';

const COUNT = CURRENCIES.length;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const COPY = {
  en: {
    title: 'Zento: Free Currency Converter | Live Exchange Rates',
    description: `Type an amount and get it converted at the live mid-market rate. Free for ${COUNT} currencies, no sign-up. Charts, rate alerts and a price scanner included.`,
    keywords: [
      'currency converter',
      'exchange rate',
      'live exchange rates',
      'mid-market rate',
      'free currency converter',
      'Zento',
    ],
  },
  ms: {
    title: 'Zento: Penukar Mata Wang Percuma | Kadar Pertukaran Semasa',
    description: `Taip jumlah dan dapatkan penukaran pada kadar pasaran tengah semasa. Percuma untuk ${COUNT} mata wang, tanpa pendaftaran. Termasuk carta, amaran kadar dan pengimbas harga.`,
    keywords: [
      'penukar mata wang',
      'kadar pertukaran',
      'tukar duit',
      'kadar pertukaran hari ini',
      'ringgit',
      'Zento',
    ],
  },
} as const;

export const viewport: Viewport = {
  themeColor: '#0d110f',
  colorScheme: 'dark',
};

export function siteMetadata(lang: Lang): Metadata {
  const c = COPY[lang];
  const url = `${APP_URL}${localePath(lang, '/')}`;
  return {
    metadataBase: new URL(APP_URL),
    // Brand first on the home page; inner pages use "<page> | Zento"
    title: { default: c.title, template: '%s | Zento' },
    applicationName: 'Zento',
    description: c.description,
    keywords: [...c.keywords],
    robots: { index: true, follow: true },
    // Favicon and Apple icon come from app/icon.svg and app/apple-icon.tsx
    alternates: { canonical: url, languages: languageAlternates(APP_URL, '/') },
    openGraph: {
      title: c.title,
      description: c.description,
      type: 'website',
      url,
      siteName: 'Zento',
      locale: LANG_META[lang].og,
    },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description },
  };
}

function siteJsonLd(lang: Lang) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      name: 'Zento',
      alternateName: ['Zento Currency Converter'],
      url: APP_URL,
      inLanguage: ['en', 'ms'],
      publisher: { '@id': `${APP_URL}/#organization` },
      description: COPY[lang].description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${APP_URL}/#webapp`,
      name: 'Zento',
      url: `${APP_URL}${localePath(lang, '/')}`,
      inLanguage: LANG_META[lang].html,
      publisher: { '@id': `${APP_URL}/#organization` },
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: COPY[lang].description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'Zento',
      url: APP_URL,
      logo: `${APP_URL}/pwa-icon/512`,
      // sameAs is how Google resolves "Zento" to this entity rather than a same-named
      // company. Every additional verifiable profile added here strengthens that link.
      sameAs: ['https://github.com/HaikalAkif/zento'],
    },
  ];
}

export function SiteShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={LANG_META[lang].html}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(lang)) }}
        />
      </head>
      <body
        className={`${geistSans.variable} flex min-h-screen flex-col bg-paper font-sans text-ink antialiased`}
      >
        <LangProvider lang={lang}>
          <QueryProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </QueryProvider>
        </LangProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import LenisProvider from '@/providers/LenisProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { APP_URL } from '@/lib/config';
import { CURRENCIES } from '@/lib/currencies';

const CURRENCY_COUNT = CURRENCIES.length;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    // Brand first: the homepage is what should rank for the query "Zento".
    // Pair pages keep keyword-first titles via the template.
    default: 'Zento: Free Currency Converter | Live Exchange Rates',
    template: '%s | Zento',
  },
  applicationName: 'Zento',
  description:
    `Convert currencies instantly with live mid-market exchange rates. Free, accurate conversion for ${CURRENCY_COUNT} world currencies, no sign-up required. Powered by ECB data.`,
  keywords: [
    'currency converter',
    'exchange rate',
    'live exchange rates',
    'forex converter',
    'free currency converter',
    'mid-market rate',
    'currency exchange calculator',
    'real-time exchange rate',
    'USD to EUR',
    'USD to MYR',
    'currency exchange',
    'Zento',
    'Zento currency converter',
    'Zento app',
    'Zento exchange rates',
  ],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: 'Zento: Free Currency Converter | Live Exchange Rates',
    description:
      `Convert currencies instantly with live mid-market exchange rates. Free for ${CURRENCY_COUNT} world currencies, no sign-up required.`,
    type: 'website',
    url: APP_URL,
    siteName: 'Zento',
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1800, height: 945, alt: 'Zento Currency Converter' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zento: Free Currency Converter | Live Exchange Rates',
    description:
      `Convert currencies instantly with live mid-market exchange rates. Free for ${CURRENCY_COUNT} world currencies, no sign-up required.`,
    images: ['/og.png'],
    // No `site` handle. @zentoapp is not a Zento account, and claiming it would
    // attribute every shared card to a stranger. Add it back if the handle is registered.
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${APP_URL}/#website`,
    name: 'Zento',
    alternateName: ['Zento Currency Converter', 'Zento App'],
    url: APP_URL,
    inLanguage: 'en',
    publisher: { '@id': `${APP_URL}/#organization` },
    description:
      `Free live currency converter with mid-market exchange rates for ${CURRENCY_COUNT} currencies.`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${APP_URL}/{search_term_string}-to-{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${APP_URL}/#webapp`,
    name: 'Zento',
    alternateName: 'Zento Currency Converter',
    url: APP_URL,
    publisher: { '@id': `${APP_URL}/#organization` },
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      `Free real-time currency converter supporting ${CURRENCY_COUNT} currencies with live mid-market exchange rates from ExchangeRate-API and ECB data via Frankfurter.`,
    featureList: [
      'Live mid-market exchange rates',
      `${CURRENCY_COUNT} world currencies`,
      'Historical rate charts (up to 1 year)',
      'No sign-up required',
      'Mobile-friendly',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Zento Currency Exchange',
    url: APP_URL,
    description: 'Free online currency conversion using live mid-market rates.',
    serviceType: 'Currency Conversion',
    areaServed: 'Worldwide',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: APP_URL,
      serviceType: 'Online',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${APP_URL}/#organization`,
    name: 'Zento',
    alternateName: 'Zento Currency Converter',
    url: APP_URL,
    logo: `${APP_URL}/favicon.png`,
    // sameAs is how Google resolves "Zento" to this entity rather than a same-named
    // company. Every additional verifiable profile added here strengthens that link.
    sameAs: ['https://github.com/HaikalAkif/zento'],
    description:
      `Zento provides free real-time currency conversion for ${CURRENCY_COUNT} world currencies using live mid-market exchange rates from ExchangeRate-API and European Central Bank data.`,
    foundingDate: '2024',
    serviceArea: { '@type': 'Place', name: 'Worldwide' },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-slate-950 text-slate-50 min-h-screen flex flex-col`}
      >
        <LenisProvider>
          <QueryProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </QueryProvider>
        </LenisProvider>
      </body>
    </html>
  );
}

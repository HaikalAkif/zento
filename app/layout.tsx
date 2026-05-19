import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import LenisProvider from '@/providers/LenisProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { APP_URL } from '@/lib/config';

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
    default: 'Free Currency Converter — Live Exchange Rates | Zento',
    template: '%s | Zento',
  },
  description:
    'Convert currencies instantly with live mid-market exchange rates. Free, accurate conversion for 173 world currencies — no sign-up required. Powered by ECB data.',
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
  ],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  themeColor: '#020617',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: 'Free Currency Converter — Live Exchange Rates | Zento',
    description:
      'Convert currencies instantly with live mid-market exchange rates. Free for 173 world currencies — no sign-up required.',
    type: 'website',
    url: APP_URL,
    siteName: 'Zento',
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Zento Currency Converter' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Currency Converter — Live Exchange Rates | Zento',
    description:
      'Convert currencies instantly with live mid-market exchange rates. Free for 173 world currencies — no sign-up required.',
    images: ['/og.png'],
    site: '@zentoapp',
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zento',
    url: APP_URL,
    description:
      'Free live currency converter with mid-market exchange rates for 173 currencies.',
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
    name: 'Zento Currency Converter',
    url: APP_URL,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Free real-time currency converter supporting 173 currencies with live mid-market exchange rates from ExchangeRate-API and ECB data via Frankfurter.',
    featureList: [
      'Live mid-market exchange rates',
      '173 world currencies',
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
    name: 'Zento',
    url: APP_URL,
    logo: `${APP_URL}/favicon.png`,
    description:
      'Zento provides free real-time currency conversion for 173 world currencies using live mid-market exchange rates from ExchangeRate-API and European Central Bank data.',
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

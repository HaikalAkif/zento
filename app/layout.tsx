import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import LenisProvider from '@/providers/LenisProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zento.haikalakif.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Currency Converter - Zento',
    template: '%s | Zento',
  },
  description:
    'Convert currencies instantly with live mid-market exchange rates. Free, fast, and accurate currency conversion for 166 world currencies — no sign-up required.',
  keywords: [
    'currency converter',
    'exchange rate',
    'live exchange rates',
    'forex converter',
    'free currency converter',
    'USD to EUR',
    'USD to MYR',
    'currency exchange',
    'mid-market rate',
    'Zento',
  ],
  robots: { index: true, follow: true },
  // Replace with your actual Google Search Console verification code
  // verification: { google: 'YOUR_GOOGLE_VERIFICATION_CODE' },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Currency Converter - Zento',
    description:
      'Convert currencies instantly with live mid-market exchange rates. Free for 166 world currencies.',
    type: 'website',
    url: APP_URL,
    siteName: 'Zento',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Zento Currency Converter' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Currency Converter - Zento',
    description:
      'Convert currencies instantly with live mid-market exchange rates. Free for 166 world currencies.',
    images: ['/og.png'],
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Zento Currency Converter',
  url: APP_URL,
  description: 'Free live currency converter with mid-market exchange rates for 166 currencies.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${APP_URL}/{from}-to-{to}`,
    },
    'query-input': 'required name=from',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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

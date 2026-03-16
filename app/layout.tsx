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
    template: '%s - Zento',
  },
  description:
    'Convert currencies instantly with live exchange rates. Fast, free, and accurate currency conversion for 25+ world currencies.',
  keywords: ['currency converter', 'exchange rates', 'forex', 'USD', 'EUR', 'MYR', 'SGD', 'live rates'],
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
    description: 'Convert currencies instantly with live exchange rates.',
    type: 'website',
    url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Currency Converter - Zento' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Currency Converter - Zento',
    description: 'Convert currencies instantly with live exchange rates.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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

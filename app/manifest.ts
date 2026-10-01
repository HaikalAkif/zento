import type { MetadataRoute } from 'next';
import { CURRENCIES } from '@/lib/currencies';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zento: Live Currency Converter',
    short_name: 'Zento',
    description: `Free live currency converter with mid-market rates for ${CURRENCIES.length} currencies.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d110f',
    theme_color: '#0d110f',
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

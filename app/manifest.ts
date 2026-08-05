import type { MetadataRoute } from 'next';
import { CURRENCIES } from '@/lib/currencies';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zento: Live Currency Converter',
    short_name: 'Zento',
    description: `Free live currency converter with mid-market rates for ${CURRENCIES.length} currencies.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    // TODO: add real 192x192 and 512x512 maskable PNGs. favicon.png is 240x240 and has
    // no maskable safe zone, so declaring those sizes here would just get it cropped.
    icons: [{ src: '/favicon.png', sizes: '240x240', type: 'image/png', purpose: 'any' }],
  };
}

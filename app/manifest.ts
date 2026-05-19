import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zento — Live Currency Converter',
    short_name: 'Zento',
    description: 'Free live currency converter with mid-market rates for 173 currencies.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

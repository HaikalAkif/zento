import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zento.haikalakif.com';

const STATIC_PAIRS = [
  'usd-to-myr',
  'myr-to-usd',
  'eur-to-usd',
  'usd-to-eur',
  'gbp-to-usd',
  'usd-to-gbp',
  'usd-to-jpy',
  'usd-to-sgd',
  'sgd-to-myr',
  'eur-to-gbp',
  'aud-to-usd',
  'usd-to-cad',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...STATIC_PAIRS.map((pair) => ({
      url: `${BASE_URL}/${pair}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];
}

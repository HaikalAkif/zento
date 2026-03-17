import type { MetadataRoute } from 'next';
import { STATIC_PAIRS } from './[pair]/page';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zento.haikalakif.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pairPages: MetadataRoute.Sitemap = STATIC_PAIRS.map((pair) => ({
    url: `${BASE_URL}/${pair}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...pairPages,
  ];
}

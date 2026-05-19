import type { MetadataRoute } from 'next';
import { APP_URL as BASE_URL, STATIC_PAIRS } from '@/lib/config';

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

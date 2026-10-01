import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/config';
import { indexablePairs } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  // Pair pages render live rates, so they genuinely change daily
  const today = new Date();
  return [
    { url: APP_URL, lastModified: today, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/guide`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    ...indexablePairs().map(({ path, major }) => ({
      url: `${APP_URL}${path}`,
      lastModified: today,
      changeFrequency: 'daily' as const,
      // Pairs between two majors get a little more weight than the USD long tail
      priority: major ? 0.8 : 0.6,
    })),
  ];
}

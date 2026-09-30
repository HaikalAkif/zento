import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Never block /_next/: it holds the JS and CSS Googlebot needs to render
        // the page. Blocking it makes Google index an unstyled, empty converter.
        disallow: ['/api/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}

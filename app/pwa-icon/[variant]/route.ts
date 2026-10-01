import { markImage } from '@/lib/mark-image';

// Install and notification icons: /pwa-icon/192, /pwa-icon/512, /pwa-icon/maskable (512,
// mark inside the launcher safe zone) and /pwa-icon/badge (96, white on transparent).
const VARIANTS = new Map([
  ['192', { size: 192, maskable: false, badge: false }],
  ['512', { size: 512, maskable: false, badge: false }],
  ['maskable', { size: 512, maskable: true, badge: false }],
  ['badge', { size: 96, maskable: false, badge: true }],
]);

export async function GET(_request: Request, { params }: { params: Promise<{ variant: string }> }) {
  // A Map, not an object literal: "constructor" or "__proto__" must 404, not resolve
  const variant = VARIANTS.get((await params).variant);
  if (!variant) return new Response('Not found', { status: 404 });
  const image = markImage(variant.size, variant);
  // Icons only change on deploy; let browsers and the edge keep them
  image.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  return image;
}

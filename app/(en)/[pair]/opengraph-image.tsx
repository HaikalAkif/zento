import { ogSize, pairOgImage } from '@/app/_views/og';

export const alt = 'Zento currency converter';
export const size = ogSize;
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ pair: string }> }) {
  return pairOgImage('en', (await params).pair);
}

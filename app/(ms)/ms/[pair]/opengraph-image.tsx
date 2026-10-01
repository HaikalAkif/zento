import { ogSize, pairOgImage } from '@/app/_views/og';

export const alt = 'Penukar mata wang Zento';
export const size = ogSize;
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ pair: string }> }) {
  return pairOgImage('ms', (await params).pair);
}

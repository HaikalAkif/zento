import { currencyOgImage, ogSize } from '@/app/_views/og';

export const alt = 'Profil mata wang Zento';
export const size = ogSize;
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  return currencyOgImage('ms', (await params).code);
}

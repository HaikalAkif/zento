import { currencyOgImage, ogSize } from '@/app/_views/og';

export const alt = 'Zento currency profile';
export const size = ogSize;
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  return currencyOgImage('en', (await params).code);
}

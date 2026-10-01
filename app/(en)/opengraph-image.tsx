import { homeOgImage, ogSize } from '@/app/_views/og';

export const alt = 'Zento: type an amount, get the conversion';
export const size = ogSize;
export const contentType = 'image/png';

export default function OgImage() {
  return homeOgImage('en');
}

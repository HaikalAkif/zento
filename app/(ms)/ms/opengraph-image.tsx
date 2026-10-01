import { homeOgImage, ogSize } from '@/app/_views/og';

export const alt = 'Zento: taip jumlah, dapatkan penukaran';
export const size = ogSize;
export const contentType = 'image/png';

export default function OgImage() {
  return homeOgImage('ms');
}

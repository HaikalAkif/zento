import { markImage } from '@/lib/mark-image';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iOS rounds the corners itself, so this is a full square tile
export default function AppleIcon() {
  return markImage(180);
}

import { ImageResponse } from 'next/og';
import { MARK, markSvg } from './mark';

/**
 * The mark as a PNG at any size. `maskable` keeps it inside the central 80% safe zone
 * Android launchers crop to, with the tile colour bleeding to every edge. `badge` is a
 * white glyph on transparency: Android draws notification badges from alpha alone,
 * so an opaque tile would show as a solid white square.
 */
export function markImage(size: number, { maskable = false, badge = false } = {}): ImageResponse {
  const svg = markSvg({ tile: false, mono: badge ? '#ffffff' : undefined });
  const glyph = `data:image/svg+xml;base64,${btoa(svg)}`;
  const inner = Math.round(size * (maskable ? 0.62 : badge ? 1 : 0.86));
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: badge ? 'transparent' : MARK.paper,
      }}
    >
      {/* oxlint-disable-next-line nextjs/no-img-element -- rendered by Satori, not the browser */}
      <img src={glyph} width={inner} height={inner} alt="" />
    </div>,
    { width: size, height: size },
  );
}

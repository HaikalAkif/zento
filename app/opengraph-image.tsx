import { ImageResponse } from 'next/og';

export const alt = 'Zento: type an amount, get the conversion';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PAPER = '#0d110f';
const INK = '#ece7da';
const INK_3 = '#8d897d';
const ACCENT = '#7fd1a8';

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: PAPER,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
        color: INK,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: -1 }}>zento</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 40, color: INK_3 }}>150 euro in ringgit</div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 300,
            letterSpacing: -7,
            color: ACCENT,
            lineHeight: 1,
            marginTop: 20,
          }}
        >
          694.54
        </div>
        <div style={{ fontSize: 32, color: INK_3, marginTop: 24 }}>
          Type an amount. Get the live mid-market conversion.
        </div>
      </div>
    </div>,
    { ...size },
  );
}

import { ImageResponse } from 'next/og';
import { getCurrency } from '@/lib/currencies';

export const alt = 'Zento currency converter';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The site's palette. Satori only has its bundled sans face, which suits the design.
const PAPER = '#0d110f';
const INK = '#ece7da';
const INK_3 = '#8d897d';
const ACCENT = '#7fd1a8';

interface Props {
  params: Promise<{ pair: string }>;
}

function parsePair(slug: string): { from: string; to: string } | null {
  const match = slug.match(/^([a-z]{3})-to-([a-z]{3})$/);
  if (!match) return null;
  return { from: match[1].toUpperCase(), to: match[2].toUpperCase() };
}

export default async function OgImage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  const fromCode = parsed?.from ?? 'USD';
  const toCode = parsed?.to ?? 'EUR';
  const fromName = getCurrency(fromCode)?.name ?? fromCode;
  const toName = getCurrency(toCode)?.name ?? toCode;

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
        <div
          style={{
            display: 'flex',
            fontSize: 132,
            fontWeight: 300,
            letterSpacing: -6,
            lineHeight: 1,
          }}
        >
          <span>{fromCode}&nbsp;</span>
          <span style={{ color: INK_3 }}>to&nbsp;</span>
          <span style={{ color: ACCENT }}>{toCode}</span>
        </div>
        <div style={{ fontSize: 32, color: INK_3, marginTop: 28 }}>
          {`${fromName} to ${toName} at the live mid-market rate`}
        </div>
      </div>
    </div>,
    { ...size },
  );
}

import { ImageResponse } from 'next/og';
import { getCurrency } from '@/lib/currencies';

export const alt = 'Zento Currency Converter';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ pair: string }>;
}

function parsePair(slug: string): { from: string; to: string } | null {
  const match = slug.match(/^([a-z]{3})-to-([a-z]{3})$/);
  if (!match) return null;
  return { from: match[1].toUpperCase(), to: match[2].toUpperCase() };
}

// Satori only knows its bundled sans face, so the seal is suggested with concentric
// rings rather than drawn, and currencies are shown by code (some symbols have no glyph).
const PAPER = '#f2eee3';
const INK = '#16150f';
const INK_2 = '#57534a';
const GREEN = '#0e5a43';

function Coin({ code }: { code: string }) {
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        border: `3px solid ${GREEN}`,
        boxShadow: `inset 0 0 0 7px ${PAPER}, inset 0 0 0 9px rgba(14,90,67,0.35)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: GREEN,
        fontSize: 34,
        fontWeight: 600,
        letterSpacing: 1,
      }}
    >
      {code}
    </div>
  );
}

export default async function OgImage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);

  const from = parsed ? getCurrency(parsed.from) : null;
  const to = parsed ? getCurrency(parsed.to) : null;

  const fromCode = parsed?.from ?? 'USD';
  const toCode = parsed?.to ?? 'EUR';
  const fromName = from?.name ?? fromCode;
  const toName = to?.name ?? toCode;

  return new ImageResponse(
    <div
      style={{
        background: PAPER,
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        padding: '64px 72px',
        fontFamily: 'sans-serif',
        color: INK,
      }}
    >
      {/* Seal rings, bleeding off the right edge */}
      {[520, 470, 420, 300, 250].map((d, i) => (
        <div
          key={d}
          style={{
            position: 'absolute',
            right: -130 + (520 - d) / 2,
            top: 55 + (520 - d) / 2,
            width: d,
            height: d,
            borderRadius: d / 2,
            border: `${i === 0 || i === 3 ? 2 : 1}px solid rgba(14,90,67,${i === 0 ? 0.5 : 0.25})`,
          }}
        />
      ))}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>Zento</span>
          <span style={{ fontSize: 16, color: INK_2, letterSpacing: 4 }}>FX</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 36 }}>
            <Coin code={fromCode} />
            <Coin code={toCode} />
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 110,
              fontWeight: 600,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            <span>{fromCode} to&nbsp;</span>
            <span style={{ color: GREEN }}>{toCode}</span>
          </div>
          <div style={{ fontSize: 30, color: INK_2, marginTop: 18 }}>
            {`${fromName} to ${toName}, live mid-market rate`}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: INK_2,
            borderTop: `1px solid rgba(22,21,15,0.2)`,
            paddingTop: 20,
          }}
        >
          Free currency converter · 150+ currencies · no sign-up
        </div>
      </div>
    </div>,
    { ...size },
  );
}

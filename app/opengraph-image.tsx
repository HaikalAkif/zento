import { ImageResponse } from 'next/og';
import { CURRENCIES } from '@/lib/currencies';

export const alt = 'Zento: free currency converter with live mid-market rates';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same paper, ink and banknote green as the site and the pair share images
const PAPER = '#f2eee3';
const INK = '#16150f';
const INK_2 = '#57534a';
const GREEN = '#0e5a43';

export default function OgImage() {
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
          <div
            style={{
              display: 'flex',
              fontSize: 104,
              fontWeight: 600,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            <span>Currency,&nbsp;</span>
            <span style={{ color: GREEN }}>converted.</span>
          </div>
          <div style={{ fontSize: 30, color: INK_2, marginTop: 22 }}>
            {`Live mid-market rates for ${CURRENCIES.length} currencies`}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: INK_2,
            borderTop: '1px solid rgba(22,21,15,0.2)',
            paddingTop: 20,
          }}
        >
          Free · no account · no ads
        </div>
      </div>
    </div>,
    { ...size },
  );
}

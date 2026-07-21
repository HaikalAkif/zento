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

export default async function OgImage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);

  const from = parsed ? getCurrency(parsed.from) : null;
  const to = parsed ? getCurrency(parsed.to) : null;

  const fromCode = parsed?.from ?? 'USD';
  const toCode = parsed?.to ?? 'EUR';
  const fromName = from?.name ?? fromCode;
  const toName = to?.name ?? toCode;
  const fromFlag = from?.flag ?? '';
  const toFlag = to?.flag ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Blue accent circle */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Brand */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 60,
            fontSize: 28,
            fontWeight: 700,
            color: '#3b82f6',
            letterSpacing: '-0.5px',
          }}
        >
          Zento
        </div>

        {/* Live badge */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 14,
            color: '#60a5fa',
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
            }}
          />
          Live Rate
        </div>

        {/* Currency pair display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            marginBottom: 32,
          }}
        >
          {/* FROM */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 72 }}>{fromFlag}</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-2px' }}>
              {fromCode}
            </div>
            <div style={{ fontSize: 20, color: '#64748b', fontWeight: 500 }}>{fromName}</div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 40, color: '#3b82f6' }}>→</div>
          </div>

          {/* TO */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 72 }}>{toFlag}</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-2px' }}>
              {toCode}
            </div>
            <div style={{ fontSize: 20, color: '#64748b', fontWeight: 500 }}>{toName}</div>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: '#475569',
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}
        >
          Live Exchange Rate · Free · No Sign-up
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

// Open Graph images for each page type and language. Satori only has its bundled sans
// face, which suits the design. Every multi-child <div> needs display: flex.

import { ImageResponse } from 'next/og';
import { getCurrency } from '@/lib/currencies';
import { currencyName, type Lang } from '@/lib/i18n';

export const ogSize = { width: 1200, height: 630 };

// The site's palette
const PAPER = '#0d110f';
const INK = '#ece7da';
const INK_3 = '#8d897d';
const ACCENT = '#7fd1a8';

const COPY = {
  en: {
    homeQuery: '150 euro in ringgit',
    homeLine: 'Type an amount. Get the live mid-market conversion.',
    to: 'to',
    pairLine: (from: string, to: string) => `${from} to ${to} at the live mid-market rate`,
    currencyLine: 'Live rates, history and where it is used',
  },
  ms: {
    homeQuery: '150 euro ke ringgit',
    homeLine: 'Taip jumlah. Dapatkan penukaran pasaran tengah semasa.',
    to: 'ke',
    pairLine: (from: string, to: string) => `${from} ke ${to} pada kadar pasaran tengah semasa`,
    currencyLine: 'Kadar semasa, sejarah dan di mana ia digunakan',
  },
} satisfies Record<Lang, unknown>;

function Frame({ children }: { children: React.ReactNode }) {
  return (
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

export function homeOgImage(lang: Lang) {
  const c = COPY[lang];
  return new ImageResponse(
    <Frame>
      <div style={{ fontSize: 40, color: INK_3 }}>{c.homeQuery}</div>
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
      <div style={{ fontSize: 32, color: INK_3, marginTop: 24 }}>{c.homeLine}</div>
    </Frame>,
    { ...ogSize },
  );
}

export function pairOgImage(lang: Lang, slug: string) {
  const c = COPY[lang];
  const match = slug.match(/^([a-z]{3})-to-([a-z]{3})$/);
  const from = match && getCurrency(match[1].toUpperCase()) ? match[1].toUpperCase() : 'USD';
  const to = match && getCurrency(match[2].toUpperCase()) ? match[2].toUpperCase() : 'EUR';
  return new ImageResponse(
    <Frame>
      <div
        style={{
          display: 'flex',
          fontSize: 132,
          fontWeight: 300,
          letterSpacing: -6,
          lineHeight: 1,
        }}
      >
        <span>{from}&nbsp;</span>
        <span style={{ color: INK_3 }}>{c.to}&nbsp;</span>
        <span style={{ color: ACCENT }}>{to}</span>
      </div>
      <div style={{ fontSize: 32, color: INK_3, marginTop: 28 }}>
        {c.pairLine(currencyName(from, lang), currencyName(to, lang))}
      </div>
    </Frame>,
    { ...ogSize },
  );
}

export function currencyOgImage(lang: Lang, slug: string) {
  const c = COPY[lang];
  const code = getCurrency(slug.toUpperCase()) ? slug.toUpperCase() : 'USD';
  return new ImageResponse(
    <Frame>
      <div
        style={{
          display: 'flex',
          fontSize: 132,
          fontWeight: 300,
          letterSpacing: -6,
          lineHeight: 1,
        }}
      >
        <span style={{ color: ACCENT }}>{code}</span>
      </div>
      <div style={{ fontSize: 44, marginTop: 28 }}>{currencyName(code, lang)}</div>
      <div style={{ fontSize: 30, color: INK_3, marginTop: 12 }}>{c.currencyLine}</div>
    </Frame>,
    { ...ogSize },
  );
}

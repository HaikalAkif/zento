/**
 * Where each ECB currency sits on the globe: its financial capital, as [lat, lon].
 * Only currencies with ECB history are listed, since the globe compares year-on-year.
 */
export const CURRENCY_LOCATIONS: Record<string, [number, number]> = {
  USD: [40.71, -74.01], // New York
  EUR: [50.11, 8.68], // Frankfurt
  GBP: [51.51, -0.13],
  JPY: [35.68, 139.69],
  CHF: [47.37, 8.54], // Zurich
  CNY: [31.23, 121.47], // Shanghai
  AUD: [-33.87, 151.21], // Sydney
  NZD: [-36.85, 174.76], // Auckland
  SGD: [1.35, 103.82],
  HKD: [22.32, 114.17],
  MYR: [3.14, 101.69],
  IDR: [-6.21, 106.85],
  THB: [13.76, 100.5],
  PHP: [14.6, 120.98],
  KRW: [37.57, 126.98],
  INR: [19.08, 72.88], // Mumbai
  CAD: [43.65, -79.38], // Toronto
  MXN: [19.43, -99.13],
  BRL: [-23.55, -46.63], // São Paulo
  ZAR: [-26.2, 28.05], // Johannesburg
  TRY: [41.01, 28.98], // Istanbul
  SEK: [59.33, 18.07],
  NOK: [59.91, 10.75],
  DKK: [55.68, 12.57],
  PLN: [52.23, 21.01],
  CZK: [50.08, 14.44],
  HUF: [47.5, 19.04],
  RON: [44.43, 26.1],
  ISK: [64.15, -21.94],
};

// ── Projection ───────────────────────────────────────────────────────────────
// Mirrors cobe's own marker maths (dist/index.esm.js: `U` and `O`), so DOM overlays
// land exactly on the WebGL markers without relying on CSS anchor positioning.

const GLOBE_RADIUS = 0.8;

/** [lat, lon] → cobe's unit-sphere coordinates. */
function toSphere([lat, lon]: [number, number]): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180 - Math.PI;
  const c = Math.cos(la);
  return [-c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}

/**
 * Screen position of a location for a square globe canvas, as fractions (0–1) of
 * its width and height, plus whether it faces the viewer.
 */
export function projectLocation(
  location: [number, number],
  phi: number,
  theta: number,
  elevation: number,
): { x: number; y: number; visible: boolean } {
  const [sx, sy, sz] = toSphere(location);
  const r = GLOBE_RADIUS + elevation;
  const [x, y, z] = [sx * r, sy * r, sz * r];

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);

  const c = cosP * x + sinP * z;
  const s = sinP * sinT * x + cosT * y - cosP * sinT * z;
  const depth = -sinP * cosT * x + sinT * y + cosP * cosT * z;

  return { x: (c + 1) / 2, y: (-s + 1) / 2, visible: depth >= 0 || c * c + s * s >= 0.64 };
}

/** The phi that turns `lon` to face the viewer. */
export function phiFacing(lon: number): number {
  return (3 * Math.PI) / 2 - (lon * Math.PI) / 180;
}

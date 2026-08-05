import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Every asset this site loads is same-origin: fonts are self-hosted by next/font,
// and all rate data goes through /api/*. So the policy can stay tight everywhere
// except inline script and style.
//
// script-src keeps 'unsafe-inline' because Next's hydration payload is inline and
// the JSON-LD blocks are too. The nonce alternative needs middleware to mint one
// per request, which would turn all 44 prerendered pair pages into on-demand
// renders. Not worth it here: the site has no user-generated content, so there is
// no path for attacker markup to reach the page in the first place.
//
// style-src needs it for the inline style attributes Recharts and the slider set.
//
// 'unsafe-eval' is dev-only, for the HMR runtime.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  turbopack: {
    // A stray lockfile exists in the parent folder; pin the root here.
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          // Superseded by frame-ancestors above, kept for older browsers
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;

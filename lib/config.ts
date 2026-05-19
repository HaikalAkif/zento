export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://zento.haikalakif.com';

export const STATIC_PAIRS = [
  // USD majors
  'usd-to-eur', 'eur-to-usd',
  'usd-to-gbp', 'gbp-to-usd',
  'usd-to-jpy', 'jpy-to-usd',
  'usd-to-cad', 'cad-to-usd',
  'usd-to-aud', 'aud-to-usd',
  'usd-to-chf', 'chf-to-usd',
  'usd-to-cny', 'cny-to-usd',
  'usd-to-inr', 'inr-to-usd',
  'usd-to-myr', 'myr-to-usd',
  'usd-to-sgd', 'sgd-to-usd',
  'usd-to-hkd', 'hkd-to-usd',
  'usd-to-nzd', 'nzd-to-usd',
  'usd-to-aed', 'aed-to-usd',
  // Regional popular
  'eur-to-gbp', 'gbp-to-eur',
  'eur-to-jpy', 'jpy-to-eur',
  'eur-to-inr', 'inr-to-eur',
  'gbp-to-inr', 'inr-to-gbp',
  'sgd-to-myr', 'myr-to-sgd',
  'jpy-to-myr', 'myr-to-jpy',
  'aud-to-nzd', 'nzd-to-aud',
  'aud-to-sgd', 'sgd-to-aud',
] as const;

export type StaticPair = (typeof STATIC_PAIRS)[number];

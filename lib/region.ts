import { getCurrency } from './currencies';

// ISO 3166-1 alpha-2 country → ISO 4217 currency. Only currencies Zento supports
// are listed; anything missing falls back to USD.
const EUR_COUNTRIES = [
  'AD',
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MC',
  'ME',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
  'SM',
  'VA',
  'XK',
  'GF',
  'GP',
  'MQ',
  'RE',
  'YT',
  'PM',
  'BL',
  'MF',
  'AX',
];

const COUNTRY_CURRENCY: Record<string, string> = {
  ...Object.fromEntries(EUR_COUNTRIES.map((c) => [c, 'EUR'])),
  // Americas
  US: 'USD',
  PR: 'USD',
  EC: 'USD',
  SV: 'USD',
  PA: 'PAB',
  CA: 'CAD',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  UY: 'UYU',
  PY: 'PYG',
  BO: 'BOB',
  VE: 'VES',
  DO: 'DOP',
  GT: 'GTQ',
  CR: 'CRC',
  HN: 'HNL',
  NI: 'NIO',
  CU: 'CUP',
  TT: 'TTD',
  JM: 'JMD',
  BB: 'BBD',
  BZ: 'BZD',
  GY: 'GYD',
  SR: 'SRD',
  AW: 'AWG',
  CW: 'ANG',
  SX: 'ANG',
  BS: 'BSD',
  KY: 'KYD',
  HT: 'HTG',
  BM: 'BMD',
  AG: 'XCD',
  DM: 'XCD',
  GD: 'XCD',
  KN: 'XCD',
  LC: 'XCD',
  VC: 'XCD',
  AI: 'XCD',
  MS: 'XCD',
  FK: 'FKP',
  // Europe (non-euro)
  GB: 'GBP',
  IM: 'GBP',
  JE: 'GBP',
  GG: 'GBP',
  GI: 'GIP',
  CH: 'CHF',
  LI: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  FO: 'DKK',
  GL: 'DKK',
  IS: 'ISK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  RS: 'RSD',
  UA: 'UAH',
  MD: 'MDL',
  MK: 'MKD',
  AL: 'ALL',
  BA: 'BAM',
  BY: 'BYN',
  RU: 'RUB',
  TR: 'TRY',
  GE: 'GEL',
  AM: 'AMD',
  AZ: 'AZN',
  // Asia-Pacific
  MY: 'MYR',
  SG: 'SGD',
  JP: 'JPY',
  CN: 'CNY',
  HK: 'HKD',
  MO: 'MOP',
  TW: 'TWD',
  KR: 'KRW',
  IN: 'INR',
  ID: 'IDR',
  TH: 'THB',
  PH: 'PHP',
  VN: 'VND',
  BD: 'BDT',
  PK: 'PKR',
  LK: 'LKR',
  NP: 'NPR',
  MM: 'MMK',
  KH: 'KHR',
  LA: 'LAK',
  MN: 'MNT',
  BT: 'BTN',
  MV: 'MVR',
  BN: 'BND',
  AU: 'AUD',
  NZ: 'NZD',
  PG: 'PGK',
  FJ: 'FJD',
  VU: 'VUV',
  WS: 'WST',
  TO: 'TOP',
  SB: 'SBD',
  KZ: 'KZT',
  UZ: 'UZS',
  KG: 'KGS',
  TJ: 'TJS',
  TM: 'TMT',
  AF: 'AFN',
  PF: 'XPF',
  NC: 'XPF',
  WF: 'XPF',
  KI: 'AUD',
  NR: 'AUD',
  TV: 'AUD',
  CK: 'NZD',
  NU: 'NZD',
  TL: 'USD',
  FM: 'USD',
  MH: 'USD',
  PW: 'USD',
  GU: 'USD',
  AS: 'USD',
  // Middle East
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  JO: 'JOD',
  IQ: 'IQD',
  IR: 'IRR',
  LB: 'LBP',
  SY: 'SYP',
  YE: 'YER',
  // Africa
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  EG: 'EGP',
  MA: 'MAD',
  DZ: 'DZD',
  TN: 'TND',
  LY: 'LYD',
  TZ: 'TZS',
  UG: 'UGX',
  ET: 'ETB',
  ZM: 'ZMW',
  MU: 'MUR',
  RW: 'RWF',
  MZ: 'MZN',
  MG: 'MGA',
  BW: 'BWP',
  NA: 'NAD',
  MW: 'MWK',
  SC: 'SCR',
  GM: 'GMD',
  GN: 'GNF',
  BI: 'BIF',
  DJ: 'DJF',
  KM: 'KMF',
  SL: 'SLE',
  SO: 'SOS',
  SD: 'SDG',
  SS: 'SSP',
  SZ: 'SZL',
  LS: 'LSL',
  LR: 'LRD',
  ST: 'STN',
  AO: 'AOA',
  CD: 'CDF',
  CV: 'CVE',
  ER: 'ERN',
  MR: 'MRU',
  SH: 'SHP',
  ZW: 'ZWG',
  CM: 'XAF',
  CF: 'XAF',
  TD: 'XAF',
  CG: 'XAF',
  GQ: 'XAF',
  GA: 'XAF',
  BJ: 'XOF',
  BF: 'XOF',
  CI: 'XOF',
  GW: 'XOF',
  ML: 'XOF',
  NE: 'XOF',
  SN: 'XOF',
  TG: 'XOF',
};

export const FALLBACK_CURRENCY = 'USD';

/** Every [country, currency] pair Zento supports, e.g. ["AR", "ARS"]. */
export function countryCurrencies(): [string, string][] {
  return Object.entries(COUNTRY_CURRENCY).filter(([, code]) => getCurrency(code));
}

export function currencyForCountry(country: string | null | undefined): string | undefined {
  if (!country) return undefined;
  const code = COUNTRY_CURRENCY[country.toUpperCase()];
  return code && getCurrency(code) ? code : undefined;
}

/** "en-MY,en;q=0.9" → "MY", "zh-Hant-TW" → "TW". First tag that carries a region wins. */
export function countryFromAcceptLanguage(header: string | null | undefined): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(',')) {
    // Subtags after the language: an optional 4-letter script, then a 2-letter region
    const region = part
      .trim()
      .split(';')[0]
      .split('-')
      .slice(1)
      .find((t) => /^[a-z]{2}$/i.test(t));
    if (region) return region.toUpperCase();
  }
  return undefined;
}

/**
 * Default pair for a first-time visitor: a USD price in their own money, which is
 * what most people are converting. Americans get USD → EUR instead.
 */
export function defaultPairFor(local: string): { from: string; to: string } {
  return local === 'USD' ? { from: 'USD', to: 'EUR' } : { from: 'USD', to: local };
}

const MULTI_BASE = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'SGD', 'AUD', 'CAD', 'CHF', 'HKD', 'INR'];

/** Ten "what it buys" targets with the visitor's currency first. */
export function multiTargetsFor(local: string): string[] {
  return [local, ...MULTI_BASE.filter((c) => c !== local)].slice(0, 10);
}

/** Cookie holding the visitor's last pair, e.g. "USD-MYR". Read server-side for the home page. */
export const PAIR_COOKIE = 'zento-pair';

export function parsePairCookie(
  value: string | undefined,
): { from: string; to: string } | undefined {
  const m = value?.match(/^([A-Z]{3})-([A-Z]{3})$/);
  if (!m || m[1] === m[2] || !getCurrency(m[1]) || !getCurrency(m[2])) return undefined;
  return { from: m[1], to: m[2] };
}

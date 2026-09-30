import { cookies, headers } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  FALLBACK_CURRENCY,
  PAIR_COOKIE,
  countryFromAcceptLanguage,
  currencyForCountry,
  defaultPairFor,
  parsePairCookie,
} from './region';

function cfCountry(): string | undefined {
  try {
    // request.cf is always populated on Workers, unlike the CF-IPCountry header,
    // which depends on a zone setting. Throws outside the Worker (next dev).
    const country = getCloudflareContext().cf?.country;
    // "XX" = unknown, "T1" = Tor
    return typeof country === 'string' && country !== 'XX' && country !== 'T1'
      ? country
      : undefined;
  } catch {
    return undefined;
  }
}

/** The visitor's home currency: Cloudflare geo, then CF-IPCountry, then browser language. */
export async function detectLocalCurrency(): Promise<string> {
  const h = await headers();
  return (
    currencyForCountry(cfCountry()) ??
    currencyForCountry(h.get('cf-ipcountry')) ??
    currencyForCountry(countryFromAcceptLanguage(h.get('accept-language'))) ??
    FALLBACK_CURRENCY
  );
}

/** Home page starting pair: the visitor's last pair if remembered, else one built from their region. */
export async function resolveHomePair(local: string): Promise<{ from: string; to: string }> {
  const jar = await cookies();
  return parsePairCookie(jar.get(PAIR_COOKIE)?.value) ?? defaultPairFor(local);
}

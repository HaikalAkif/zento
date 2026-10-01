import { getCloudflareContext } from '@opennextjs/cloudflare';

type LimiterName = 'SCAN_LIMITER' | 'MCP_LIMITER' | 'ALERT_LIMITER';

/**
 * True when this request is within the named per-IP limit. Fails open: a missing
 * binding (next dev) or a limiter error lets the request through, because the limiter
 * is a guard, not a dependency.
 */
export async function withinLimit(name: LimiterName, request: Request): Promise<boolean> {
  try {
    const limiter = getCloudflareContext().env[name];
    if (!limiter) return true;
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    return (await limiter.limit({ key: ip })).success;
  } catch {
    return true;
  }
}

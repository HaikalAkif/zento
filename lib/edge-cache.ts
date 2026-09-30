// Next's fetch data cache (`next: { revalidate }`) is a no-op on Cloudflare unless an
// incrementalCache override is configured in open-next.config.ts (needs an R2/KV binding).
// Until one exists, cache API responses at the edge with the Workers Cache API, which
// needs no bindings. Everywhere else (next dev, node) `caches` is undefined and this
// degrades to a straight pass-through.

type WorkersCache = {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
};

function edgeCache(): WorkersCache | undefined {
  return (globalThis as { caches?: { default?: WorkersCache } }).caches?.default;
}

/**
 * Serve `request` from the edge cache when possible, otherwise run `produce` and
 * store the result. Only 200 responses are cached; the TTL comes from the
 * Cache-Control header `produce` sets.
 */
export async function withEdgeCache(
  request: Request,
  produce: () => Promise<Response>,
): Promise<Response> {
  const cache = edgeCache();
  if (!cache) return produce();

  // Key on the URL string, not the request object. Next hands route handlers a
  // Proxy around NextRequest, which fails workerd's native Request check, gets
  // stringified to "[object Request]" and throws "Invalid URL", 500ing every call.
  const key = request.url;

  try {
    const hit = await cache.match(key);
    // Cached responses have immutable headers; copy so Next can still append its own.
    if (hit) return new Response(hit.body, hit);
  } catch {
    // Cache read is best-effort too. Fall through to the upstream.
  }

  const response = await produce();
  if (response.status === 200) {
    try {
      await cache.put(key, response.clone());
    } catch {
      // Cache write is best-effort. Never fail the request over it.
    }
  }
  return response;
}

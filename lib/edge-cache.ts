// Next's fetch data cache (`next: { revalidate }`) is a no-op on Cloudflare unless an
// incrementalCache override is configured in open-next.config.ts (needs an R2/KV binding).
// Until one exists, cache API responses at the edge with the Workers Cache API, which
// needs no bindings. Everywhere else (next dev, node) `caches` is undefined and this
// degrades to a straight pass-through.

type WorkersCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
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

  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await produce();
  if (response.status === 200) {
    try {
      await cache.put(request, response.clone());
    } catch {
      // Cache write is best-effort. Never fail the request over it.
    }
  }
  return response;
}

// Bindings the Next app reads through getCloudflareContext().env, declared by hand.
//
// `wrangler types` would generate these, but it also emits the full Workers runtime
// types, which override DOM types the client components rely on. The Worker entry and
// Durable Object get those runtime types instead, via worker/tsconfig.json.

import type { AlertStoreApi } from '@/lib/alerts/types';

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

declare global {
  interface CloudflareEnv {
    AI?: {
      run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
    };
    SCAN_LIMITER?: RateLimiter;
    MCP_LIMITER?: RateLimiter;
    ALERT_LIMITER?: RateLimiter;
    ALERTS?: {
      idFromName(name: string): unknown;
      get(id: unknown): AlertStoreApi;
    };
    VAPID_PUBLIC_KEY?: string;
  }
}

export {};

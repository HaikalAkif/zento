// Contract between the /api/alerts route (Next) and the AlertStore Durable Object
// (worker/alert-store.ts). The DO class `implements AlertStoreApi`, so a change on
// either side fails type-checking instead of failing at runtime.

export type AlertDirection = 'below' | 'above';

/** What the browser's PushManager hands us. */
export interface PushSubscriptionJson {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface AlertInput {
  subscription: PushSubscriptionJson;
  base: string;
  target: string;
  direction: AlertDirection;
  threshold: number;
}

export interface Alert {
  id: string;
  base: string;
  target: string;
  direction: AlertDirection;
  threshold: number;
  createdAt: string;
}

export type CreateResult = { ok: true; alert: Alert } | { ok: false; error: string };

export interface CheckSummary {
  checked: number;
  fired: number;
  removed: number;
}

export interface AlertStoreApi {
  create(input: AlertInput): Promise<CreateResult>;
  list(endpoint: string): Promise<Alert[]>;
  remove(id: string, endpoint: string): Promise<boolean>;
  check(): Promise<CheckSummary>;
}

/** Per browser. Keeps one device from filling the store. */
export const MAX_ALERTS_PER_DEVICE = 10;
/** Across everyone. A single Durable Object holds them all. */
export const MAX_ALERTS_TOTAL = 10_000;

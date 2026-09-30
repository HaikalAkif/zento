import { DurableObject } from 'cloudflare:workers';
import { buildPushPayload } from '@block65/webcrypto-web-push';
import { getCurrency } from '../lib/currencies';
import { formatRate } from '../lib/format';
import { getLatestTable } from '../lib/rates';
import {
  MAX_ALERTS_PER_DEVICE,
  MAX_ALERTS_TOTAL,
  type Alert,
  type AlertInput,
  type AlertStoreApi,
  type CheckSummary,
  type CreateResult,
} from '../lib/alerts/types';

interface AlertRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  base: string;
  target: string;
  direction: 'below' | 'above';
  threshold: number;
  created_at: string;
  [key: string]: SqlStorageValue;
}

function toAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    base: row.base,
    target: row.target,
    direction: row.direction,
    threshold: row.threshold,
    createdAt: row.created_at,
  };
}

function validate(input: AlertInput): string | null {
  const { subscription: sub, base, target, direction, threshold } = input;
  if (!sub || typeof sub.endpoint !== 'string' || sub.endpoint.length > 1000) {
    return 'Invalid push subscription';
  }
  try {
    if (new URL(sub.endpoint).protocol !== 'https:') return 'Push endpoint must be https';
  } catch {
    return 'Invalid push endpoint';
  }
  if (
    typeof sub.keys?.p256dh !== 'string' ||
    typeof sub.keys?.auth !== 'string' ||
    sub.keys.p256dh.length > 200 ||
    sub.keys.auth.length > 100
  ) {
    return 'Invalid push subscription keys';
  }
  if (!getCurrency(base) || !getCurrency(target) || base === target) return 'Invalid currency pair';
  if (direction !== 'below' && direction !== 'above') return 'direction must be below or above';
  if (typeof threshold !== 'number' || !isFinite(threshold) || threshold <= 0) {
    return 'threshold must be a positive number';
  }
  return null;
}

/**
 * Every rate alert, in one SQLite-backed Durable Object. Alerts are one-shot: when a
 * rate crosses its threshold we notify once and delete it.
 */
export class AlertStore extends DurableObject<Env> implements AlertStoreApi {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        base TEXT NOT NULL,
        target TEXT NOT NULL,
        direction TEXT NOT NULL,
        threshold REAL NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS alerts_endpoint ON alerts (endpoint);
    `);
  }

  async create(input: AlertInput): Promise<CreateResult> {
    const error = validate(input);
    if (error) return { ok: false, error };

    const { subscription: sub } = input;
    const perDevice = this.sql
      .exec<{ n: number }>('SELECT COUNT(*) AS n FROM alerts WHERE endpoint = ?', sub.endpoint)
      .one().n;
    if (perDevice >= MAX_ALERTS_PER_DEVICE) {
      return { ok: false, error: `Up to ${MAX_ALERTS_PER_DEVICE} alerts per device` };
    }
    const total = this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM alerts').one().n;
    if (total >= MAX_ALERTS_TOTAL) return { ok: false, error: 'Alerts are full right now' };

    const alert: Alert = {
      id: crypto.randomUUID(),
      base: input.base,
      target: input.target,
      direction: input.direction,
      threshold: input.threshold,
      createdAt: new Date().toISOString(),
    };
    this.sql.exec(
      'INSERT INTO alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      alert.id,
      sub.endpoint,
      sub.keys.p256dh,
      sub.keys.auth,
      alert.base,
      alert.target,
      alert.direction,
      alert.threshold,
      alert.createdAt,
    );
    return { ok: true, alert };
  }

  async list(endpoint: string): Promise<Alert[]> {
    return this.sql
      .exec<AlertRow>('SELECT * FROM alerts WHERE endpoint = ? ORDER BY created_at', endpoint)
      .toArray()
      .map(toAlert);
  }

  async remove(id: string, endpoint: string): Promise<boolean> {
    // Matching on endpoint too means only the device that made an alert can delete it
    return (
      this.sql.exec('DELETE FROM alerts WHERE id = ? AND endpoint = ?', id, endpoint).rowsWritten >
      0
    );
  }

  /** Called hourly by the cron trigger. */
  async check(): Promise<CheckSummary> {
    const rows = this.sql.exec<AlertRow>('SELECT * FROM alerts').toArray();
    const summary: CheckSummary = { checked: rows.length, fired: 0, removed: 0 };
    if (rows.length === 0) return summary;

    const vapid = {
      subject: this.env.VAPID_SUBJECT,
      publicKey: this.env.VAPID_PUBLIC_KEY,
      privateKey: this.env.VAPID_PRIVATE_KEY,
    };
    if (!vapid.privateKey) {
      console.error('VAPID_PRIVATE_KEY is not set; rate alerts cannot be delivered');
      return summary;
    }

    // One upstream call per base currency, however many alerts share it
    const tables = new Map<string, Record<string, number>>();
    for (const base of new Set(rows.map((r) => r.base))) {
      try {
        tables.set(base, (await getLatestTable(base)).rates);
      } catch (err) {
        console.error(`Rates unavailable for ${base}`, err);
      }
    }

    const deadEndpoints = new Set<string>();
    for (const row of rows) {
      if (deadEndpoints.has(row.endpoint)) continue;
      const rate = tables.get(row.base)?.[row.target];
      if (rate == null) continue;
      const crossed = row.direction === 'below' ? rate <= row.threshold : rate >= row.threshold;
      if (!crossed) continue;

      const pair = `${row.base}/${row.target}`;
      const message = {
        data: JSON.stringify({
          title: `${pair} is ${row.direction} ${formatRate(row.threshold)}`,
          body: `Now 1 ${row.base} = ${formatRate(rate)} ${row.target}. Tap to convert.`,
          url: `/${row.base.toLowerCase()}-to-${row.target.toLowerCase()}`,
          tag: `zento-${row.id}`,
        }),
        options: { ttl: 24 * 60 * 60, urgency: 'normal' as const },
      };

      try {
        const payload = await buildPushPayload(
          message,
          {
            endpoint: row.endpoint,
            expirationTime: null,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          vapid,
        );
        const res = await fetch(row.endpoint, payload);
        if (res.ok) {
          this.sql.exec('DELETE FROM alerts WHERE id = ?', row.id);
          summary.fired++;
        } else if (res.status === 404 || res.status === 410) {
          // The browser unsubscribed or the subscription expired: nothing will ever arrive
          deadEndpoints.add(row.endpoint);
          summary.removed += this.sql.exec(
            'DELETE FROM alerts WHERE endpoint = ?',
            row.endpoint,
          ).rowsWritten;
        } else {
          console.error(`Push failed with HTTP ${res.status} for alert ${row.id}`);
        }
      } catch (err) {
        console.error(`Push failed for alert ${row.id}`, err);
      }
    }
    return summary;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { AlertInput, AlertStoreApi } from '@/lib/alerts/types';

// A push subscription (endpoint + keys) is the only identity. The endpoint is an
// unguessable URL only that browser knows, so it doubles as the device's credential:
// list and delete both require it. It travels in POST bodies, never in URLs or logs.

const MAX_BODY = 4096;

function store(): AlertStoreApi | null {
  try {
    const ns = getCloudflareContext().env.ALERTS;
    return ns ? ns.get(ns.idFromName('global')) : null;
  } catch {
    // Outside the Worker (next dev)
    return null;
  }
}

/** GET /api/alerts → the VAPID public key the browser subscribes with. */
export async function GET() {
  let publicKey: string | undefined;
  try {
    publicKey = getCloudflareContext().env.VAPID_PUBLIC_KEY;
  } catch {
    publicKey = undefined;
  }
  return NextResponse.json(
    { enabled: Boolean(publicKey), publicKey: publicKey ?? null },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}

type Body =
  | ({ action: 'create' } & AlertInput)
  | { action: 'list'; endpoint: string }
  | { action: 'delete'; id: string; endpoint: string };

/** POST /api/alerts with { action: 'create' | 'list' | 'delete', ... }. */
export async function POST(request: NextRequest) {
  const alerts = store();
  if (!alerts) {
    return NextResponse.json({ error: 'Rate alerts are unavailable here' }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  let body: Body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const noStore = { headers: { 'Cache-Control': 'no-store' } };

  switch (body?.action) {
    case 'create': {
      const { subscription, base, target, direction, threshold } = body;
      const result = await alerts.create({ subscription, base, target, direction, threshold });
      return result.ok
        ? NextResponse.json({ alert: result.alert }, { status: 201, ...noStore })
        : NextResponse.json({ error: result.error }, { status: 400 });
    }
    case 'list': {
      if (typeof body.endpoint !== 'string') {
        return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
      }
      return NextResponse.json({ alerts: await alerts.list(body.endpoint) }, noStore);
    }
    case 'delete': {
      if (typeof body.id !== 'string' || typeof body.endpoint !== 'string') {
        return NextResponse.json({ error: 'id and endpoint required' }, { status: 400 });
      }
      const removed = await alerts.remove(body.id, body.endpoint);
      return NextResponse.json({ removed }, { status: removed ? 200 : 404, ...noStore });
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// Browser side of rate alerts: service worker registration and push subscription.

import type { Alert, AlertDirection } from './alerts/types';

export type PushSupport = 'supported' | 'unsupported' | 'ios-needs-install' | 'denied';

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  // iOS only exposes Web Push to sites added to the Home Screen
  if (isIos && !standalone) return 'ios-needs-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !window.isSecureContext) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  return 'supported';
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return (
    (await navigator.serviceWorker.getRegistration('/')) ??
    (await navigator.serviceWorker.register('/sw.js', { scope: '/' }))
  );
}

/** This browser's existing subscription, without prompting. */
export async function existingSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'supported') return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Subscribe, asking for notification permission if needed. */
export async function subscribe(): Promise<PushSubscription> {
  const config: { enabled: boolean; publicKey: string | null } = await (
    await fetch('/api/alerts')
  ).json();
  if (!config.enabled || !config.publicKey)
    throw new Error('Rate alerts are unavailable right now');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked for this site');

  const reg = await registration();
  await navigator.serviceWorker.ready;
  return (
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(config.publicKey),
    }))
  );
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (HTTP ${res.status})`);
  return data as T;
}

export async function createAlert(
  sub: PushSubscription,
  base: string,
  target: string,
  direction: AlertDirection,
  threshold: number,
): Promise<Alert> {
  const { alert } = await post<{ alert: Alert }>({
    action: 'create',
    subscription: sub.toJSON(),
    base,
    target,
    direction,
    threshold,
  });
  return alert;
}

export async function listAlerts(sub: PushSubscription): Promise<Alert[]> {
  return (await post<{ alerts: Alert[] }>({ action: 'list', endpoint: sub.endpoint })).alerts;
}

export async function deleteAlert(sub: PushSubscription, id: string): Promise<void> {
  await post({ action: 'delete', id, endpoint: sub.endpoint });
}

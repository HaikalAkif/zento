'use client';

import { useEffect, useState } from 'react';
import type { Alert, AlertDirection } from '@/lib/alerts/types';
import { formatRate } from '@/lib/format';
import {
  createAlert,
  deleteAlert,
  existingSubscription,
  listAlerts,
  pushSupport,
  subscribe,
  type PushSupport,
} from '@/lib/push';
import { useLang } from './LangProvider';

interface Props {
  base: string;
  target: string;
  /** Current rate, used to suggest a threshold */
  rate: number;
}

/** A threshold 1% away from today's rate, in the direction the user is watching. */
function suggest(rate: number, direction: AlertDirection): string {
  const value = rate * (direction === 'above' ? 1.01 : 0.99);
  return formatRate(value).replace(/,/g, '');
}

export default function RateAlert({ base, target, rate }: Props) {
  const { t } = useLang();
  const copy = t.alert;
  const supportMessage: Record<Exclude<PushSupport, 'supported'>, string> = {
    unsupported: copy.unsupported,
    'ios-needs-install': copy.iosInstall,
    denied: copy.denied,
  };
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [threshold, setThreshold] = useState(() => suggest(rate, 'above'));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Support and existing alerts are browser-only facts
  useEffect(() => {
    setSupport(pushSupport()); // oxlint-disable-line react/set-state-in-effect -- navigator is client-only
    existingSubscription()
      .then((sub) => (sub ? listAlerts(sub) : []))
      .then(setAlerts)
      .catch(() => {});
  }, []);

  const pickDirection = (d: AlertDirection) => {
    setDirection(d);
    setThreshold(suggest(rate, d));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(threshold);
    if (!isFinite(value) || value <= 0) {
      setMessage({ tone: 'error', text: copy.positive });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const sub = await subscribe();
      const alert = await createAlert(sub, base, target, direction, value);
      setAlerts((prev) => [...prev, alert]);
      setMessage({
        tone: 'ok',
        text: copy.done(base, copy[direction], formatRate(value), target),
      });
    } catch (err) {
      setSupport(pushSupport());
      setMessage({
        tone: 'error',
        text: err instanceof Error ? err.message : copy.failed,
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const sub = await existingSubscription();
      if (!sub) throw new Error('This browser is no longer subscribed');
      await deleteAlert(sub, id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      // Keep it in the list: it still exists on the server and would still fire
      setMessage({
        tone: 'error',
        text: err instanceof Error ? copy.deleteFailed(err.message) : copy.deleteGeneric,
      });
    }
  };

  return (
    <div className="mt-8 text-[15px]">
      {support && support !== 'supported' ? (
        <p className="text-ink-2">{supportMessage[support]}</p>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-3 text-ink-2"
        >
          <span>{copy.sentence(base)}</span>
          <span role="group" aria-label={copy.direction} className="inline-flex gap-2">
            {(['above', 'below'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => pickDirection(d)}
                aria-pressed={direction === d}
                className={`hit transition-colors ${
                  direction === d
                    ? 'text-ink underline underline-offset-4'
                    : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {copy[d]}
              </button>
            ))}
          </span>
          <label className="inline-flex items-baseline gap-1.5">
            <span className="sr-only">{copy.threshold(target)}</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-24 border-b border-line bg-transparent text-ink tabular-nums"
            />
            <span>{target}</span>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="hit text-accent transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {busy ? copy.setting : copy.set}
          </button>
        </form>
      )}

      {message && (
        <p
          role="status"
          className={`mt-3 t-label ${message.tone === 'ok' ? 'text-up' : 'text-down'}`}
        >
          {message.text}
        </p>
      )}

      {alerts.length > 0 && (
        <ul className="mt-5 space-y-1.5 t-label text-ink-3">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-baseline gap-4 tabular-nums">
              <span>
                1 {a.base} {copy[a.direction]} {formatRate(a.threshold)} {a.target}
              </span>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={copy.removeLabel(
                  `1 ${a.base} ${copy[a.direction]} ${formatRate(a.threshold)} ${a.target}`,
                )}
                className="hit text-ink-3 hover:text-down"
              >
                {copy.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 t-label text-ink-3">{copy.footnote}</p>
    </div>
  );
}

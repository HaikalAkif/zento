'use client';

import { useEffect, useState } from 'react';
import { BellAlertIcon, TrashIcon } from '@heroicons/react/24/outline';
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

const SUPPORT_MESSAGE: Record<Exclude<PushSupport, 'supported'>, string> = {
  unsupported: "This browser can't receive push notifications.",
  'ios-needs-install':
    'On iPhone and iPad, add Zento to your Home Screen (Share → Add to Home Screen), then open it from there to set alerts.',
  denied:
    'Notifications are blocked for this site. Allow them in your browser settings to set alerts.',
};

export default function RateAlert({ base, target, rate }: Props) {
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
      setMessage({ tone: 'error', text: 'Enter a rate above zero.' });
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
        text: `We'll notify you once when 1 ${base} goes ${direction} ${formatRate(value)} ${target}.`,
      });
    } catch (err) {
      setSupport(pushSupport());
      setMessage({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Could not set the alert.',
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const sub = await existingSubscription();
    if (!sub) return;
    await deleteAlert(sub, id).catch(() => {});
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-left">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <BellAlertIcon aria-hidden="true" className="h-4 w-4 text-amber-400" />
        Rate alert
      </p>

      {support && support !== 'supported' ? (
        <p className="text-sm text-slate-400">{SUPPORT_MESSAGE[support]}</p>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-wrap items-center gap-2 text-sm text-slate-300"
        >
          <span>Notify me when 1 {base} goes</span>
          <div
            role="group"
            aria-label="Direction"
            className="inline-flex overflow-hidden rounded-lg border border-slate-700"
          >
            {(['above', 'below'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => pickDirection(d)}
                aria-pressed={direction === d}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                  direction === d
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-1.5">
            <span className="sr-only">Threshold rate in {target}</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 tabular-nums outline-none focus:border-amber-500/70"
            />
            <span>{target}</span>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="ml-auto rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-60"
          >
            {busy ? 'Setting…' : 'Set alert'}
          </button>
        </form>
      )}

      {message && (
        <p
          role="status"
          className={`mt-3 text-xs ${message.tone === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {message.text}
        </p>
      )}

      {alerts.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-slate-700/60 pt-3">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 text-xs text-slate-400"
            >
              <span className="tabular-nums">
                1 {a.base} {a.direction} {formatRate(a.threshold)} {a.target}
              </span>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={`Delete alert for ${a.base} ${a.direction} ${formatRate(a.threshold)} ${a.target}`}
                className="rounded p-1 text-slate-500 hover:bg-slate-700/60 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-slate-500">
        Checked hourly against the live rate. Each alert fires once, then clears. No account needed.
      </p>
    </div>
  );
}

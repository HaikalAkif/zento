'use client';

import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pt-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-900/50 bg-red-950/50">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-50">Something went wrong</h2>
        <p className="mb-1 text-sm leading-relaxed text-slate-400">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-slate-400">ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}

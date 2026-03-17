'use client';

import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-900/50 flex items-center justify-center mx-auto mb-5">
          <ExclamationTriangleIcon className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-50 mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-1 leading-relaxed">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="text-slate-600 text-xs mb-6 font-mono">ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}

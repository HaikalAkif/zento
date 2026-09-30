'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-4 pt-20 pb-16 sm:px-6">
      <p className="t-label text-down">Something went wrong</p>
      <h1 className="mt-3 t-h1 text-ink">The ledger didn&apos;t balance.</h1>
      <p className="mt-5 max-w-md text-ink-2">{error.message || 'An unexpected error occurred.'}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-3">ref: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
      >
        <ArrowPathIcon className="h-4 w-4" />
        Try again
      </button>
    </main>
  );
}

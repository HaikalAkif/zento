'use client';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col justify-center px-5 pt-28 sm:px-6">
      <p className="t-label text-down">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">That didn&apos;t load.</h1>
      <p className="mt-4 text-[15px] text-ink-2">
        {error.message || 'An unexpected error occurred.'}
      </p>
      {error.digest && <p className="mt-2 font-mono t-label text-ink-3">ref {error.digest}</p>}
      <button onClick={reset} className="mt-8 w-fit text-[15px] text-accent hover:opacity-80">
        Try again
      </button>
    </main>
  );
}

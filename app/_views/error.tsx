'use client';

import { useLang } from '@/components/LangProvider';

const COPY = {
  en: {
    label: 'Something went wrong',
    heading: "That didn't load.",
    fallback: 'An unexpected error occurred.',
    retry: 'Try again',
  },
  ms: {
    label: 'Ada masalah',
    heading: 'Halaman itu gagal dimuatkan.',
    fallback: 'Ralat yang tidak dijangka berlaku.',
    retry: 'Cuba lagi',
  },
};

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Error boundary UI. Sits inside the root layout, so the language comes from context. */
export function ErrorView({ error, reset }: ErrorProps) {
  const c = COPY[useLang().lang];
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col justify-center px-5 pt-28 sm:px-6">
      <p className="t-label text-down">{c.label}</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">{c.heading}</h1>
      <p className="mt-4 text-[15px] text-ink-2">{error.message || c.fallback}</p>
      {error.digest && <p className="mt-2 font-mono t-label text-ink-3">ref {error.digest}</p>}
      <button onClick={reset} className="mt-8 w-fit text-[15px] text-accent hover:opacity-80">
        {c.retry}
      </button>
    </main>
  );
}

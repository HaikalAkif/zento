import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-4 pt-20 pb-16 sm:px-6">
      <p className="t-label text-ink-3">Error 404</p>
      <h1 className="mt-3 t-h1 text-ink">
        This note <span className="text-accent">isn&apos;t legal tender.</span>
      </h1>
      <p className="mt-5 max-w-md text-ink-2">
        The page doesn&apos;t exist. Pair pages look like{' '}
        <span className="font-mono">/usd-to-myr</span>.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to the converter
      </Link>
    </main>
  );
}

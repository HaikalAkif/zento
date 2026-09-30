import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col justify-center px-5 pt-28 sm:px-6">
      <p className="t-label text-ink-3">404</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">
        Nothing to convert here.
      </h1>
      <p className="mt-4 text-[15px] text-ink-2">
        This page doesn&apos;t exist. Pair pages look like{' '}
        <span className="font-mono text-ink">/usd-to-myr</span>.
      </p>
      <Link href="/" className="mt-8 w-fit text-[15px] text-accent hover:opacity-80">
        Back to the converter
      </Link>
    </main>
  );
}

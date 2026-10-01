import Link from 'next/link';
import { localePath, type Lang } from '@/lib/i18n';

const COPY = {
  en: {
    heading: 'Nothing to convert here.',
    body: "This page doesn't exist. Pair pages look like",
    back: 'Back to the converter',
  },
  ms: {
    heading: 'Tiada apa untuk ditukar di sini.',
    body: 'Halaman ini tidak wujud. Halaman pasangan kelihatan seperti',
    back: 'Kembali ke penukar',
  },
} satisfies Record<Lang, unknown>;

export function NotFoundView({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col justify-center px-5 pt-28 sm:px-6">
      <p className="t-label text-ink-3">404</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">{c.heading}</h1>
      <p className="mt-4 text-[15px] text-ink-2">
        {c.body} <span className="font-mono text-ink">{localePath(lang, '/usd-to-myr')}</span>.
      </p>
      <Link
        href={localePath(lang, '/')}
        className="mt-8 w-fit text-[15px] text-accent hover:opacity-80"
      >
        {c.back}
      </Link>
    </main>
  );
}

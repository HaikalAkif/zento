import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pt-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
          <MagnifyingGlassIcon className="h-7 w-7 text-slate-400" />
        </div>
        <p className="mb-3 text-5xl font-black tracking-tight text-slate-500">404</p>
        <h1 className="mb-2 text-xl font-bold text-slate-50">Page not found</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-400">
          This page doesn&apos;t exist. Try heading back to the converter.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
        >
          <ArrowTrendingUpIcon className="h-4 w-4" />
          Back to Zento
        </Link>
      </div>
    </div>
  );
}

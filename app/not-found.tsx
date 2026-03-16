import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-5">
          <MagnifyingGlassIcon className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-5xl font-black text-slate-700 mb-3 tracking-tight">404</p>
        <h1 className="text-xl font-bold text-slate-50 mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          This page doesn&apos;t exist. Try heading back to the converter.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <ArrowTrendingUpIcon className="w-4 h-4" />
          Back to Zento
        </Link>
      </div>
    </div>
  );
}

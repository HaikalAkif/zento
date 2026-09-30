import Link from 'next/link';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-slate-50">
          Zento
        </Link>

        <div className="flex items-center gap-5 text-sm text-slate-400">
          <Link
            href="/about"
            className="rounded transition-colors hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            About
          </Link>
          <span className="hidden items-center gap-1.5 sm:flex">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            Live Exchange Rates
          </span>
        </div>
      </div>
    </nav>
  );
}

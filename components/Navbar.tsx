import Link from 'next/link';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-slate-50">
          Zento
        </Link>

        <div className="flex items-center gap-5 text-sm text-slate-400">
          <Link
            href="/about"
            className="hover:text-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            About
          </Link>
          <span className="hidden sm:flex items-center gap-1.5">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            Live Exchange Rates
          </span>
        </div>
      </div>
    </nav>
  );
}

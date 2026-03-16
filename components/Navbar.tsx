import Link from 'next/link';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-50">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-900">
            <CurrencyDollarIcon className="w-5 h-5 text-white" />
          </div>
          <span>Zento</span>
        </Link>

        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Live Exchange Rates</span>
        </div>
      </div>
    </nav>
  );
}

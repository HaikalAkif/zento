import Link from 'next/link';
import { MARK } from '@/lib/mark';

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5">
      <g fill="none" strokeWidth={MARK.stroke} strokeLinecap="round">
        {/* currentColor + token classes, so the mark follows the theme tokens */}
        <path d={MARK.top} stroke="currentColor" className="text-ink" />
        <path d={MARK.diagonal} stroke="currentColor" className="text-ink" />
        <path d={MARK.bottom} stroke="currentColor" className="text-accent" />
      </g>
    </svg>
  );
}

const link = 'hit text-sm text-ink-3 transition-colors hover:text-ink';

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-2xl items-center gap-6 px-5 sm:px-6 lg:max-w-7xl lg:px-10"
      >
        <Link
          href="/"
          className="hit flex items-center gap-2 text-[15px] font-medium tracking-tight text-ink"
        >
          <Mark />
          zento
        </Link>
        <Link href="/guide" className={link}>
          Guide
        </Link>
        <Link href="/about" className={link}>
          About
        </Link>
      </nav>
    </header>
  );
}

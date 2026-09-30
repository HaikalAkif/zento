import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link href="/" className="flex items-baseline gap-1.5 rounded text-ink">
          <span className="text-lg font-semibold tracking-tight">Zento</span>
          <span className="text-[10px] font-medium tracking-wider text-ink-3 uppercase">fx</span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <span className="hidden items-center gap-2 text-xs text-ink-2 sm:flex">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-accent" />
            </span>
            Live mid-market rates
          </span>
          <Link href="/about" className="rounded text-ink-2 transition-colors hover:text-ink">
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}

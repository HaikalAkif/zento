import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5 sm:px-6 lg:max-w-7xl lg:px-10"
      >
        <Link href="/" className="hit text-[15px] font-medium tracking-tight text-ink">
          zento
        </Link>
        <Link href="/about" className="hit text-sm text-ink-3 transition-colors hover:text-ink">
          About
        </Link>
      </nav>
    </header>
  );
}

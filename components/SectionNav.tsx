'use client';

import { useEffect, useRef, useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
}

/**
 * Sticky index of the sections below the fold. Highlights the one you're reading and
 * keeps it scrolled into view on narrow screens.
 */
export default function SectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        // The first section (in page order) that's meaningfully on screen wins
        const current = items.find((i) => (visible.get(i.id) ?? 0) > 0.05);
        setActive(current?.id ?? null);
      },
      // Ignore the band hidden under the sticky header
      { rootMargin: '-120px 0px -45% 0px', threshold: [0, 0.05, 0.25, 0.5] },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  // Keep the active item visible in the horizontally scrolling strip
  useEffect(() => {
    if (!active || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-id="${active}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-14 z-30 border-y border-line bg-paper/85 backdrop-blur-sm"
    >
      <ol
        ref={listRef}
        className="mx-auto flex max-w-6xl [scrollbar-width:none] gap-1 overflow-x-auto px-2 sm:px-4 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} data-id={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`relative flex items-baseline gap-1.5 px-3 py-3 text-sm transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <span className="text-[10px] text-ink-3 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-px h-0.5 origin-left bg-accent transition-transform duration-300 ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

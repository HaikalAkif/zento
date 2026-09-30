import type { ReactNode } from 'react';

interface Props {
  id: string;
  /** Two-digit index shown in the margin, e.g. "01" */
  index: string;
  title: ReactNode;
  /** One line under the title */
  kicker?: ReactNode;
  /** Controls that belong to the heading, e.g. period toggles */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * An editorial section: hairline rule, index number, serif title, then content.
 * Deliberately not a card. On wide screens the heading sits in its own column.
 */
export default function Section({ id, index, title, kicker, aside, children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:gap-10">
        <header className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p className="t-label text-accent tabular-nums">{index}</p>
            <h2 id={`${id}-title`} className="mt-1.5 t-h2 text-ink">
              {title}
            </h2>
            {kicker && (
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">{kicker}</p>
            )}
            {aside && <div className="mt-5">{aside}</div>}
          </div>
        </header>
        <div className="min-w-0 lg:col-span-8">{children}</div>
      </div>
    </section>
  );
}

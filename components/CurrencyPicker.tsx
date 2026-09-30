'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CURRENCIES, getCurrency } from '@/lib/currencies';

interface Props {
  open: boolean;
  /** What's being picked, for the accessible name: "Convert from" / "Convert to" */
  title: string;
  value: string;
  /** Recently used codes, shown first when there's no search */
  recent: string[];
  onSelect: (code: string) => void;
  onClose: () => void;
}

/**
 * Currency picker in a native <dialog>: focus trapping, Escape and the backdrop
 * come for free. A bottom sheet on phones, a centred panel on wider screens.
 */
export default function CurrencyPicker({ open, title, value, recent, onSelect, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      searchRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return CURRENCIES.filter(
        (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      ).sort((a, b) => Number(b.code.toLowerCase() === q) - Number(a.code.toLowerCase() === q));
    }
    const recentSet = new Set(recent);
    const first = recent.map((code) => getCurrency(code)).filter((c) => c != null);
    return [...first, ...CURRENCIES.filter((c) => !recentSet.has(c.code))];
  }, [query, recent]);

  // Keep the keyboard-highlighted option in view
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (code: string) => {
    onSelect(code);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && options[active]) {
      e.preventDefault();
      choose(options[active].code);
    }
  };

  const showRecentLabel = !query.trim() && recent.length > 0;

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click; Escape closes natively
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={() => {
        setQuery('');
        setActive(0);
        onClose();
      }}
      // A click on the backdrop lands on the dialog itself (outside the panel) and closes
      // it. Keyboard users have Escape, which <dialog> handles natively.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-2xl bg-paper-2 p-0 text-ink backdrop:bg-black/60 sm:m-auto sm:max-h-[70vh] sm:w-[26rem] sm:rounded-2xl"
    >
      <div className="flex max-h-[inherit] flex-col">
        <div className="px-5 pt-5 pb-3">
          <p className="t-label text-ink-3">{title}</p>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search currency or code"
            aria-label="Search currencies"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="currency-options"
            aria-activedescendant={options[active] ? `currency-${options[active].code}` : undefined}
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full bg-transparent text-xl text-ink placeholder:text-ink-3"
          />
        </div>
        <div
          id="currency-options"
          ref={listRef}
          role="listbox"
          aria-label="Currencies"
          className="flex-1 overflow-y-auto overscroll-contain px-2 pb-3"
        >
          {options.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-3">No currency matches</p>
          )}
          {options.map((c, i) => (
            // Options stay out of the tab order: the search box owns the keyboard and
            // points at the highlighted one with aria-activedescendant.
            <div
              key={c.code}
              id={`currency-${c.code}`}
              data-index={i}
              role="option"
              aria-selected={c.code === value}
              tabIndex={-1}
              onClick={() => choose(c.code)}
              onKeyDown={(e) => e.key === 'Enter' && choose(c.code)}
              onMouseMove={() => setActive(i)}
              className={`flex cursor-pointer items-baseline gap-3 rounded-lg px-3 py-2.5 ${
                i === active ? 'bg-paper-3' : ''
              }`}
            >
              <span
                className={`w-11 shrink-0 text-sm font-medium ${c.code === value ? 'text-accent' : 'text-ink'}`}
              >
                {c.code}
              </span>
              <span className="truncate text-sm text-ink-2">{c.name}</span>
              {showRecentLabel && i === 0 && (
                <span className="ml-auto shrink-0 text-xs text-ink-3">recent</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrency, CURRENCIES } from '@/lib/currencies';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CurrencyMark from './CurrencyMark';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Which edge the dropdown anchors to. Default: 'left'. Use 'right' for dropdowns near the right edge. */
  align?: 'left' | 'right';
}

export default function CurrencySelect({ value, onChange, label, align = 'left' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = getCurrency(value);

  const filtered = search.trim()
    ? CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : CURRENCIES;

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLButtonElement>('[data-option]');
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const handleSelect = useCallback(
    (code: string) => {
      onChange(code);
      close();
    },
    [onChange, close],
  );

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
    if (e.key === 'Escape') close();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (focusedIndex >= 0) {
          e.preventDefault();
          handleSelect(filtered[focusedIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-2 block t-label text-ink-2">{label}</label>}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setFocusedIndex(-1);
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select currency, current: ${selected?.name}`}
        title={selected?.name}
        className={`flex items-center gap-2 rounded-full border py-1.5 pr-2.5 pl-2 transition-colors duration-200 ${
          open
            ? 'border-accent bg-accent-tint'
            : 'border-line-strong bg-paper hover:border-ink-2 hover:bg-paper-2'
        }`}
      >
        <CurrencyMark code={value} size="sm" />
        <span className="shrink-0 text-base font-semibold tracking-wide text-ink">
          {selected?.code}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-ink-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown: fixed width so it's readable on narrow screens */}
      {open && (
        <div
          role="listbox"
          aria-label="Select a currency"
          className={`absolute top-[calc(100%+8px)] w-72 max-w-[calc(100vw-2rem)] ${align === 'right' ? 'right-0' : 'left-0'} z-100 overflow-hidden rounded-2xl border border-line-strong bg-paper shadow-lift motion-safe:animate-[rise_0.18s_ease-out]`}
        >
          {/* Search */}
          <div className="border-b border-line p-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-paper-2 px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-ink-3" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search 150+ currencies"
                aria-label="Search currencies"
                className="flex-1 bg-transparent text-base leading-tight text-ink placeholder:text-ink-3 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFocusedIndex(-1);
                  }}
                  className="shrink-0"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-3.5 w-3.5 text-ink-3 transition hover:text-ink" />
                </button>
              )}
            </div>
          </div>

          {/* Options: arrow keys drive this list, so options are tabIndex={-1};
              Tab would otherwise walk through every currency */}
          {/* data-lenis-prevent stops Lenis from intercepting wheel events inside this list */}
          <div ref={listRef} className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-ink-2">No results</div>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={c.code}
                  type="button"
                  data-option
                  role="option"
                  aria-selected={c.code === value}
                  tabIndex={-1}
                  onClick={() => handleSelect(c.code)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === focusedIndex
                      ? 'bg-paper-3'
                      : c.code === value
                        ? 'bg-accent-tint'
                        : 'hover:bg-paper-2'
                  }`}
                >
                  <CurrencyMark code={c.code} size="sm" />
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span
                      className={`shrink-0 text-sm font-semibold ${c.code === value ? 'text-accent' : 'text-ink'}`}
                    >
                      {c.code}
                    </span>
                    <span className="truncate text-xs text-ink-2">{c.name}</span>
                  </div>
                  {c.code === value && (
                    <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrency, CURRENCIES } from '@/lib/currencies';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
      {label && (
        <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-400 uppercase">
          {label}
        </label>
      )}

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
        className="flex w-full items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 transition-all duration-200 hover:border-slate-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <span className="shrink-0 text-xl leading-none select-none">{selected?.flag}</span>
        <span className="shrink-0 text-sm font-bold text-slate-50">{selected?.code}</span>
        {/* Name hidden on mobile to prevent overflow in narrow viewports */}
        <span className="hidden min-w-0 flex-1 truncate text-left text-sm text-slate-400 sm:inline">
          – {selected?.name}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown: fixed width so it's readable on narrow screens */}
      {open && (
        <div
          role="listbox"
          aria-label="Select a currency"
          className={`absolute top-[calc(100%+6px)] w-64 max-w-[calc(100vw-2rem)] ${align === 'right' ? 'right-0' : 'left-0'} z-100 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50`}
        >
          {/* Search */}
          <div className="border-b border-slate-800 p-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 transition focus-within:border-blue-500">
              <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search currency..."
                aria-label="Search currencies"
                className="flex-1 bg-transparent text-base leading-tight text-slate-200 placeholder:text-slate-600 focus:outline-none"
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
                  <XMarkIcon className="h-3.5 w-3.5 text-slate-500 transition hover:text-slate-300" />
                </button>
              )}
            </div>
          </div>

          {/* Options: arrow keys drive this list, so options are tabIndex={-1};
              Tab would otherwise walk through every currency */}
          {/* data-lenis-prevent stops Lenis from intercepting wheel events inside this list */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto overscroll-contain py-1"
            data-lenis-prevent
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-slate-400">No results</div>
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
                      ? 'bg-slate-700'
                      : c.code === value
                        ? 'bg-blue-600/15'
                        : 'hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg leading-none select-none">{c.flag}</span>
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span
                      className={`shrink-0 text-sm font-bold ${c.code === value ? 'text-blue-400' : 'text-slate-200'}`}
                    >
                      {c.code}
                    </span>
                    <span className="truncate text-xs text-slate-400">{c.name}</span>
                  </div>
                  {c.code === value && (
                    <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
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

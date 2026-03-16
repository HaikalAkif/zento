'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrency, CURRENCIES } from '@/lib/currencies';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function CurrencySelect({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Reset focused index when search query or open state changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [search, open]);

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
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select currency, current: ${selected?.name}`}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl hover:border-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <span className="text-2xl leading-none select-none">{selected?.flag}</span>
        <div className="flex-1 text-left min-w-0">
          <div className="font-bold text-slate-50 text-sm leading-tight">{selected?.code}</div>
          <div className="text-xs text-slate-500 truncate mt-0.5">{selected?.name}</div>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Select a currency"
          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-100 overflow-hidden"
        >
          {/* Search */}
          <div className="p-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 focus-within:border-blue-500 transition">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search currency..."
                aria-label="Search currencies"
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="shrink-0"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div ref={listRef} className="overflow-y-auto max-h-56 py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">No results</div>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={c.code}
                  type="button"
                  data-option
                  role="option"
                  aria-selected={c.code === value}
                  onClick={() => handleSelect(c.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                    i === focusedIndex
                      ? 'bg-slate-700'
                      : c.code === value
                        ? 'bg-blue-600/15'
                        : 'hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg leading-none select-none">{c.flag}</span>
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span
                      className={`font-bold text-sm shrink-0 ${c.code === value ? 'text-blue-400' : 'text-slate-200'}`}
                    >
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-500 truncate">{c.name}</span>
                  </div>
                  {c.code === value && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
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

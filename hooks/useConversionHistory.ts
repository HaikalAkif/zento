import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'zento-history';
const MAX_ITEMS = 8;

export interface HistoryItem {
  from: string;
  to: string;
}

function readStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as HistoryItem[])
      .filter((h) => typeof h?.from === 'string' && typeof h?.to === 'string')
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function useConversionHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(readStorage()); // eslint-disable-line react-hooks/set-state-in-effect -- hydrates from localStorage, unavailable during SSR
  }, []);

  const add = useCallback((from: string, to: string) => {
    setHistory((prev) => {
      const deduped = prev.filter((h) => !(h.from === from && h.to === to));
      const next = [{ from, to }, ...deduped].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { history, add };
}

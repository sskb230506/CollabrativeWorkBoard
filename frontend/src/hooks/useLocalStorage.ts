import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useLocalStorage — typed localStorage state that falls back gracefully on SSR
// ─────────────────────────────────────────────────────────────────────────────

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const toStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(toStore);
      window.localStorage.setItem(key, JSON.stringify(toStore));
    } catch {
      // ignore write errors
    }
  };

  return [storedValue, setValue] as const;
}

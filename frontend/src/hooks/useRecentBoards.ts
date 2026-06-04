import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useRecentBoards
//
// Keeps track of the IDs of recently accessed boards in localStorage.
// Limits the list to the last 4 unique items.
// ─────────────────────────────────────────────────────────────────────────────

export const useRecentBoards = () => {
  const [recentIds, setRecentIds] = useLocalStorage<string[]>('recent-boards', []);

  const addRecentBoard = useCallback((boardId: string) => {
    if (!boardId) return;
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== boardId);
      return [boardId, ...filtered].slice(0, 4);
    });
  }, [setRecentIds]);

  return { recentIds, addRecentBoard };
};

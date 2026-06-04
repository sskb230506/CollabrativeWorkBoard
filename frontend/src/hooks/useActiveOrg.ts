import { useLocalStorage } from './useLocalStorage';

// ─────────────────────────────────────────────────────────────────────────────
// useActiveOrg — tracks which organization the user is currently viewing
//
// Persisted to localStorage so the selection survives hard reloads.
// ─────────────────────────────────────────────────────────────────────────────

export const useActiveOrg = () => {
  const [activeOrgId, setActiveOrgId] = useLocalStorage<string | null>('activeOrgId', null);
  return { activeOrgId, setActiveOrgId };
};

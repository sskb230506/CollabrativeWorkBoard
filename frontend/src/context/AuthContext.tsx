import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authApi } from '@api/auth.api';
import { setAccessToken } from '@api/client';
import type { User } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Context
//
// Design decisions:
//   - Holds `user` and `isLoading` at the top of the tree. All protected
//     routes read from here to know if the user is authenticated.
//   - On mount, attempts a silent refresh (cookie-based). This restores
//     sessions on hard-reload without exposing the refresh token to JS.
//   - Listens for the 'auth:logout' custom DOM event emitted by the Axios
//     client's 401 interceptor so the context and interceptor don't need
//     to import each other (avoids circular dependency).
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  // ── Boot: silent refresh ────────────────────────────────────────────────────
  useEffect(() => {
    const bootSession = async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const currentUser = await authApi.me();
        setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };
    void bootSession();
  }, [clearSession]);

  // ── Listen for forced logout from Axios interceptor ─────────────────────────
  useEffect(() => {
    const handler = () => clearSession();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearSession]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: loggedInUser } = await authApi.login({ email, password });
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const { accessToken, user: newUser } = await authApi.register({ email, name, password });
    setAccessToken(accessToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: user !== null, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

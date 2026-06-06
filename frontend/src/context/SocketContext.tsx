import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken, setAccessToken } from '@api/client';
import { authApi } from '@api/auth.api';
import type { PresenceEntry } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Socket Context
//
// Design decisions:
//   - A single socket instance is created per organization session. Destroying
//     and recreating it on org change prevents stale room subscriptions.
//   - The organizationId is required in the handshake (backend enforces this).
//   - `joinBoard` / `leaveBoard` are stable callbacks; components call them
//     in useEffect cleanup to avoid orphan room subscriptions.
//   - Presence state is maintained here so the avatar stack can be rendered
//     anywhere without prop-drilling.
// ─────────────────────────────────────────────────────────────────────────────

const WS_URL = import.meta.env['VITE_WS_URL'] ?? 'http://localhost:5000';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  presence: PresenceEntry[];
  joinBoard: (boardId: string, meta: { name: string; avatarUrl?: string | null | undefined }) => void;
  leaveBoard: (boardId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: React.ReactNode;
  organizationId: string | null;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  organizationId,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<PresenceEntry[]>([]);

  useEffect(() => {
    if (!organizationId) return;

    const token = getAccessToken();
    if (!token) return;

    const s = io(WS_URL, {
      auth: { token, organizationId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setSocket(s);

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));
    s.on('presence:update', (entries: PresenceEntry[]) => setPresence(entries));

    s.on('connect_error', async (err) => {
      if (
        err.message === 'Invalid or expired token' ||
        err.message === 'Authentication failed' ||
        err.message === 'Authentication token required'
      ) {
        try {
          const { accessToken } = await authApi.refresh();
          setAccessToken(accessToken);
          s.auth = { token: accessToken, organizationId };
          s.connect();
        } catch {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }
    });

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
      setPresence([]);
    };
  }, [organizationId]);

  const joinBoard = useCallback(
    (boardId: string, meta: { name: string; avatarUrl?: string | null | undefined }) => {
      socket?.emit('board:join', boardId);
      socket?.emit('presence:join', { boardId, ...meta });
    },
    [socket],
  );

  const leaveBoard = useCallback((boardId: string) => {
    socket?.emit('board:leave', boardId);
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, presence, joinBoard, leaveBoard }}
    >
      {children}
    </SocketContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useSocket = (): SocketContextValue => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

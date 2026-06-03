import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from '@websocket/socket.server';

// ─────────────────────────────────────────────────────────────────────────────
// Presence Handler
//
// Tracks which users are online and which board/card they are currently viewing.
// This powers the "avatar stack" UI showing live collaborators on a board.
//
// Implementation: in-memory Map for single instance.
// For multi-instance, this must move to Redis (HSET per org, TTL-based cleanup).
// ─────────────────────────────────────────────────────────────────────────────

interface PresenceEntry {
  userId: string;
  name: string | undefined;
  avatarUrl: string | null | undefined;
  boardId: string;
  lastSeen: number;
}

// In-process presence store — keyed by socketId
const presenceStore = new Map<string, PresenceEntry>();

export const registerPresenceHandlers = (
  io: SocketServer,
  socket: AuthenticatedSocket,
): void => {
  const { userId } = socket.data.user;

  socket.on('presence:join', (payload: { boardId: string; name: string; avatarUrl?: string }) => {
    const entry: PresenceEntry = {
      userId,
      name: payload.name,
      avatarUrl: payload.avatarUrl,
      boardId: payload.boardId,
      lastSeen: Date.now(),
    };

    presenceStore.set(socket.id, entry);

    // Broadcast updated presence list to all board members
    const boardPresence = getBoardPresence(payload.boardId);
    io.to(`board:${payload.boardId}`).emit('presence:update', boardPresence);

    // presence joined — client receives the updated list via presence:update
  });

  socket.on('presence:cursor', (payload: { boardId: string; x: number; y: number }) => {
    socket.to(`board:${payload.boardId}`).emit('presence:cursor', {
      userId,
      x: payload.x,
      y: payload.y,
    });
  });

  socket.on('disconnect', () => {
    const entry = presenceStore.get(socket.id);
    if (entry) {
      presenceStore.delete(socket.id);
      const boardPresence = getBoardPresence(entry.boardId);
      io.to(`board:${entry.boardId}`).emit('presence:update', boardPresence);
    }
  });
};

const getBoardPresence = (boardId: string): PresenceEntry[] => {
  return Array.from(presenceStore.values()).filter((e) => e.boardId === boardId);
};

import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from '@websocket/socket.server';

// ─────────────────────────────────────────────────────────────────────────────
// Card Socket Events
// ─────────────────────────────────────────────────────────────────────────────

export const CARD_EVENTS = {
  CREATED: 'card:created',
  UPDATED: 'card:updated',
  DELETED: 'card:deleted',
  MOVED: 'card:moved',
  ASSIGNED: 'card:assigned',
  COMMENT_ADDED: 'card:comment:added',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Card Socket Handlers
//
// Card mutations are performed via REST API (POST/PATCH). The REST controller
// then emits Socket.IO events to broadcast the change to all board members.
// Clients listening on the board room receive real-time updates without polling.
//
// This pattern (REST write → Socket broadcast) is intentional:
//   - Keeps mutations transactional and auditable
//   - Avoids the complexity of socket-only writes (no HTTP fallback)
// ─────────────────────────────────────────────────────────────────────────────

export const registerCardHandlers = (
  _io: SocketServer,
  socket: AuthenticatedSocket,
): void => {
  const { userId } = socket.data.user;

  // Client typing indicator on a card
  socket.on('card:typing:start', ({ cardId }: { cardId: string }) => {
    socket.broadcast.to(`board:${cardId}`).emit('card:typing', { userId, cardId, typing: true });
  });

  socket.on('card:typing:stop', ({ cardId }: { cardId: string }) => {
    socket.broadcast.to(`board:${cardId}`).emit('card:typing', { userId, cardId, typing: false });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Server-side emitter helpers
// Called by REST controllers to push changes to connected clients.
// ─────────────────────────────────────────────────────────────────────────────

export const emitCardCreated = (
  io: SocketServer,
  boardId: string,
  data: unknown,
): void => {
  io.to(`board:${boardId}`).emit(CARD_EVENTS.CREATED, data);
};

export const emitCardUpdated = (
  io: SocketServer,
  boardId: string,
  data: unknown,
): void => {
  io.to(`board:${boardId}`).emit(CARD_EVENTS.UPDATED, data);
};

export const emitCardDeleted = (
  io: SocketServer,
  boardId: string,
  cardId: string,
): void => {
  io.to(`board:${boardId}`).emit(CARD_EVENTS.DELETED, { cardId });
};

export const emitCardMoved = (
  io: SocketServer,
  boardId: string,
  data: unknown,
): void => {
  io.to(`board:${boardId}`).emit(CARD_EVENTS.MOVED, data);
};

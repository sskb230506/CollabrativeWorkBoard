import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from '@websocket/socket.server';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Socket Event Constants
// Centralized to prevent string typos across client and server.
// Keep in sync with the frontend's socket event constants.
// ─────────────────────────────────────────────────────────────────────────────

export const BOARD_EVENTS = {
  JOIN: 'board:join',
  LEAVE: 'board:leave',
  UPDATED: 'board:updated',
  LIST_CREATED: 'board:list:created',
  LIST_UPDATED: 'board:list:updated',
  LIST_DELETED: 'board:list:deleted',
  LIST_REORDERED: 'board:list:reordered',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Board Socket Handlers
// ─────────────────────────────────────────────────────────────────────────────

export const registerBoardHandlers = (
  _io: SocketServer,
  socket: AuthenticatedSocket,
): void => {
  const { userId } = socket.data.user;

  // Client joins a specific board room to receive board-level events
  socket.on(BOARD_EVENTS.JOIN, async (boardId: string) => {
    logger.debug({ userId, boardId }, 'User joining board room');
    await socket.join(`board:${boardId}`);
    socket.to(`board:${boardId}`).emit('board:user:joined', { userId, boardId });
  });

  socket.on(BOARD_EVENTS.LEAVE, async (boardId: string) => {
    logger.debug({ userId, boardId }, 'User leaving board room');
    await socket.leave(`board:${boardId}`);
    socket.to(`board:${boardId}`).emit('board:user:left', { userId, boardId });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Server-side list emitter helpers
// Called by REST controllers to push changes to connected clients.
// ─────────────────────────────────────────────────────────────────────────────

export const emitListCreated = (
  io: SocketServer,
  boardId: string,
  data: unknown,
): void => {
  io.to(`board:${boardId}`).emit(BOARD_EVENTS.LIST_CREATED, data);
};

export const emitListUpdated = (
  io: SocketServer,
  boardId: string,
  data: unknown,
): void => {
  io.to(`board:${boardId}`).emit(BOARD_EVENTS.LIST_UPDATED, data);
};

export const emitListDeleted = (
  io: SocketServer,
  boardId: string,
  listId: string,
): void => {
  io.to(`board:${boardId}`).emit(BOARD_EVENTS.LIST_DELETED, { listId });
};


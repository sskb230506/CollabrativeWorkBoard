import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from '@websocket/socket.server';
import { PresenceService } from '@websocket/presence.service';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Presence Handler
//
// Tracks which users are online and which board they are currently viewing.
// Stored in Upstash/local Redis for distributed scaling and self-healing.
// ─────────────────────────────────────────────────────────────────────────────

export const registerPresenceHandlers = (
  io: SocketServer,
  socket: AuthenticatedSocket,
): void => {
  const { userId, organizationId, name, avatarUrl } = socket.data.user;

  // Client joins a specific board for presence tracking
  socket.on('user_joined_board', async (payload: { boardId: string }) => {
    const { boardId } = payload;
    logger.debug({ userId, boardId }, 'Presence join board');

    // Join the Socket.IO room for board messages
    await socket.join(`board:${boardId}`);

    // Update Redis presence state
    const entry = await PresenceService.joinBoard(socket.id, boardId);
    if (!entry) return;

    // Get current active board presence
    const boardPresence = await PresenceService.getBoardPresence(boardId);

    // Broadcast updated presence list to the entire board room
    io.to(`board:${boardId}`).emit('presence_updated', boardPresence);

    // Notify other users on the board that this user joined
    socket.to(`board:${boardId}`).emit('user_joined_board', {
      userId,
      name,
      avatarUrl,
      boardId,
    });

    // Broadcast updated organization-wide presence list (reflecting board change)
    const orgPresence = await PresenceService.getOrgPresence(organizationId);
    io.to(`org:${organizationId}`).emit('presence_updated:org', orgPresence);
  });

  // Client leaves a specific board (e.g. going back to dashboard)
  socket.on('user_left_board', async (payload: { boardId: string }) => {
    const { boardId } = payload;
    logger.debug({ userId, boardId }, 'Presence leave board');

    // Leave the Socket.IO room
    await socket.leave(`board:${boardId}`);

    // Update Redis presence state
    const left = await PresenceService.leaveBoard(socket.id);
    if (!left) return;

    // Get current active board presence
    const boardPresence = await PresenceService.getBoardPresence(boardId);

    // Broadcast updated presence list to the board room
    io.to(`board:${boardId}`).emit('presence_updated', boardPresence);

    // Notify other users on the board that this user left
    socket.to(`board:${boardId}`).emit('user_left_board', { userId });

    // Broadcast updated organization presence list
    const orgPresence = await PresenceService.getOrgPresence(organizationId);
    io.to(`org:${organizationId}`).emit('presence_updated:org', orgPresence);
  });

  // Cursor movement (ephemeral, not persisted to Redis to maintain high performance)
  socket.on('presence:cursor', (payload: { boardId: string; x: number; y: number }) => {
    socket.to(`board:${payload.boardId}`).emit('presence:cursor', {
      userId,
      x: payload.x,
      y: payload.y,
    });
  });
};

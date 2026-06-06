import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from '../socket.server';
import { logger } from '@lib/logger';

export const registerCommentHandlers = (
  _io: SocketServer,
  socket: AuthenticatedSocket,
): void => {
  const { userId, name } = socket.data.user;

  socket.on('user_typing', (payload: { boardId: string; cardId: string }) => {
    const { boardId, cardId } = payload;
    logger.debug({ userId, cardId }, 'User typing on card');
    
    // Broadcast to others in the board room
    socket.to(`board:${boardId}`).emit('user_typing', {
      cardId,
      userId,
      name,
    });
  });

  socket.on('user_stopped_typing', (payload: { boardId: string; cardId: string }) => {
    const { boardId, cardId } = payload;
    logger.debug({ userId, cardId }, 'User stopped typing on card');
    
    // Broadcast to others in the board room
    socket.to(`board:${boardId}`).emit('user_stopped_typing', {
      cardId,
      userId,
    });
  });
};

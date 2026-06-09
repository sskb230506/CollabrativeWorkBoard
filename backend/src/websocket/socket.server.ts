import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '@config/app.config';
import { prisma } from '../prisma/client';
import { logger } from '@lib/logger';
import { JwtAccessPayload, SocketUser } from '@appTypes';
import { registerBoardHandlers } from '@websocket/handlers/board.handler';
import { registerCardHandlers } from '@websocket/handlers/card.handler';
import { registerPresenceHandlers } from '@websocket/handlers/presence.handler';
import { registerCommentHandlers } from './handlers/comment.handler';
import { PresenceService } from '@websocket/presence.service';

// ─────────────────────────────────────────────────────────────────────────────
// Socket.IO Server Setup
//
// Architecture decisions:
//   1. All sockets are authenticated via JWT middleware (no anonymous sockets)
//   2. Sockets join organization-scoped rooms for tenant isolation
//      Room format: `org:{organizationId}` | `board:{boardId}`
//   3. For multi-instance Render deployments, add the @socket.io/redis-adapter
//      backed by Upstash so events broadcast across all instances.
//      (Not enabled yet — add when scaling beyond 1 Render instance)
// ─────────────────────────────────────────────────────────────────────────────

// Extend Socket type to carry authenticated user data
export interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
  };
}

let ioInstance: SocketServer | null = null;

export const getIO = (): SocketServer => {
  if (!ioInstance) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return ioInstance;
};

export const initSocketServer = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origins,
      credentials: true,
    },
    // Connection state recovery — clients auto-replay missed events after reconnect
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
    // Tune transport for production
    transports: ['websocket', 'polling'], // WebSocket first, polling fallback
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  ioInstance = io;

  // ── Authentication Middleware ────────────────────────────────────────────
  io.use((socket, next) => {
    void (async () => {
      try {
        const token =
          (socket.handshake.auth as Record<string, string>)['token'] ??
          socket.handshake.headers['authorization']?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        let payload: JwtAccessPayload;
        try {
          payload = jwt.verify(token, config.auth.accessSecret) as JwtAccessPayload;
        } catch {
          return next(new Error('Invalid or expired token'));
        }

        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, status: true, name: true, avatarUrl: true },
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('Account not found or suspended'));
        }

        const organizationId =
          (socket.handshake.auth as Record<string, string>)['organizationId'] ?? '';

        if (!organizationId) {
          return next(new Error('organizationId required in handshake auth'));
        }

        // Verify membership
        const membership = await prisma.organizationMember.findUnique({
          where: { organizationId_userId: { organizationId, userId: user.id } },
          select: { role: true },
        });

        if (!membership) {
          return next(new Error('Not a member of this organization'));
        }

        (socket as AuthenticatedSocket).data.user = {
          userId: user.id,
          organizationId,
          name: user.name,
          avatarUrl: user.avatarUrl,
        };

        next();
      } catch (err) {
        logger.error({ err }, 'Socket authentication error');
        next(new Error('Authentication failed'));
      }
    })();
  });

  // ── Connection Handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, organizationId, name, avatarUrl } = authSocket.data.user;

    logger.info({ socketId: socket.id, userId, organizationId }, 'Socket connected');

    // Join organization room for org-wide broadcasts
    void socket.join(`org:${organizationId}`);

    // Join user-specific room for notifications
    void socket.join(`user:${userId}`);

    // Set user presence in Redis on connect and broadcast
    void (async () => {
      await PresenceService.setUserPresence(socket.id, {
        userId,
        name,
        avatarUrl,
        organizationId,
      });
      const orgPresence = await PresenceService.getOrgPresence(organizationId);
      io.to(`org:${organizationId}`).emit('presence_updated:org', orgPresence);
    })();

    // Register feature-specific handlers
    registerBoardHandlers(io, authSocket);
    registerCardHandlers(io, authSocket);
    registerPresenceHandlers(io, authSocket);
    registerCommentHandlers(io, authSocket);

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, 'Socket disconnected');
      
      void (async () => {
        const cleaned = await PresenceService.removeUserPresence(socket.id);
        if (cleaned) {
          // Broadcast organization presence update
          const orgPresence = await PresenceService.getOrgPresence(cleaned.organizationId);
          io.to(`org:${cleaned.organizationId}`).emit('presence_updated:org', orgPresence);

          // If they were on a board, broadcast board presence update
          if (cleaned.boardId) {
            const boardPresence = await PresenceService.getBoardPresence(cleaned.boardId);
            io.to(`board:${cleaned.boardId}`).emit('presence_updated', boardPresence);
            io.to(`board:${cleaned.boardId}`).emit('user_left_board', { userId: cleaned.userId });
          }
        }
      })();
    });

    socket.on('error', (err) => {
      logger.error({ err, socketId: socket.id, userId }, 'Socket error');
    });
  });

  logger.info('✅ Socket.IO server initialized');
  return io;
};

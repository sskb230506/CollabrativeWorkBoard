import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config/app.config';
import { prisma } from '../prisma/client';
import { UnauthorizedError } from '@lib/errors';
import { JwtAccessPayload, AuthenticatedUser } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Middleware
//
// Validates the JWT Bearer token on protected routes.
// On success, attaches `req.user` for downstream handlers.
//
// Why not use sessions? JWTs are stateless — critical for horizontal scaling
// on Render where multiple instances run without shared session storage.
// The tradeoff is token revocation complexity, handled via short-lived access
// tokens + refresh token rotation.
// ─────────────────────────────────────────────────────────────────────────────

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Bearer token required');
    }

    const token = authHeader.slice(7); // strip "Bearer "

    let payload: JwtAccessPayload;
    try {
      payload = jwt.verify(token, config.auth.accessSecret) as JwtAccessPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired');
      }
      throw new UnauthorizedError('Invalid access token');
    }

    // Verify the user still exists (handles account deletion / suspension)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, avatarUrl: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account not found or suspended');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };

    req.user = authenticatedUser;
    next();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Optional Auth — attaches user if token exists but does not require it.
// Used for public endpoints that behave differently for authenticated users.
// ─────────────────────────────────────────────────────────────────────────────

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.auth.accessSecret) as JwtAccessPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, avatarUrl: true, status: true },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl };
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
};

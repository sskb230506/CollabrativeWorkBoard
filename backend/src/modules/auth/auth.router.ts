import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { validate } from '@middleware/validate.middleware';
import { authenticate } from '@middleware/auth.middleware';
import { authLimiter, strictLimiter } from '@middleware/rateLimiter.middleware';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from './auth.schema';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Router — Dependency Injection (manual, no DI container)
//
// We manually wire Repository → Service → Controller here.
// For 10k+ users this is sufficient. If the codebase grows further, consider
// a DI container like tsyringe or inversify.
// ─────────────────────────────────────────────────────────────────────────────

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

// Public routes (no authentication required)
authRouter.post(
  '/register',
  authLimiter,
  validate({ body: RegisterSchema }),
  authController.register,
);

authRouter.post(
  '/login',
  authLimiter,
  validate({ body: LoginSchema }),
  authController.login,
);

authRouter.post(
  '/refresh',
  authController.refresh,
);

// Protected routes
authRouter.post(
  '/logout',
  authenticate,
  authController.logout,
);

authRouter.post(
  '/logout-all',
  authenticate,
  strictLimiter,
  authController.logoutAll,
);

authRouter.get(
  '/me',
  authenticate,
  authController.me,
);

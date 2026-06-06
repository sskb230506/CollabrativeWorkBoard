import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendCreated, asyncHandler } from '@lib/api.helpers';
import { RegisterInput, LoginInput } from './auth.schema';
import { UnauthorizedError } from '@lib/errors';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Controller
//
// Thin HTTP adapter — it only:
//   1. Extracts validated data from req.body (already coerced by validate())
//   2. Delegates to the service
//   3. Formats the response using helpers
//
// No business logic lives here. If you find yourself writing an if-statement
// in a controller, it likely belongs in the service.
// ─────────────────────────────────────────────────────────────────────────────

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body as RegisterInput);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendCreated(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }, 'Account created successfully');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body as LoginInput);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }, 200, 'Login successful');
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = (req.body?.refreshToken || req.cookies?.refreshToken) as string;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }
    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, tokens, 200, 'Tokens refreshed');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = (req.body?.refreshToken || req.cookies?.refreshToken) as string;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 200, 'Logged out successfully');
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id; // guaranteed by authenticate middleware
    await this.authService.logoutAll(userId);
    return sendSuccess(res, null, 200, 'Logged out from all devices');
  });

  me = asyncHandler((req: Request, res: Response) => {
    // req.user already attached by authenticate middleware — no service call needed
    return Promise.resolve(sendSuccess(res, req.user));
  });
}

import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendCreated, asyncHandler } from '@lib/api.helpers';
import { RegisterInput, LoginInput } from './auth.schema';

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
    return sendCreated(res, result, 'Account created successfully');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body as LoginInput);
    return sendSuccess(res, result, 200, 'Login successful');
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };
    const tokens = await this.authService.refreshTokens(refreshToken);
    return sendSuccess(res, tokens, 200, 'Tokens refreshed');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };
    await this.authService.logout(refreshToken);
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

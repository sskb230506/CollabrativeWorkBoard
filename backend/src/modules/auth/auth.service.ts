import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@config/app.config';
import { AuthRepository } from './auth.repository';
import { ConflictError, UnauthorizedError } from '@lib/errors';
import { TokenPair, JwtAccessPayload, JwtRefreshPayload } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  tokens: TokenPair;
}

export class AuthService {
  constructor(private readonly authRepo: AuthRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.authRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, config.auth.bcryptRounds);

    const user = await this.authRepo.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    const tokens = await this.generateAndStoreTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.authRepo.findByEmail(input.email);

    const dummyHash = '$2b$12$invalidhashforcomparison000000000000000000000000000';
    const passwordHash = user?.passwordHash ?? dummyHash;

    const isValid = await bcrypt.compare(input.password, passwordHash);

    if (!user || !isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is suspended');
    }

    const tokens = await this.generateAndStoreTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: JwtRefreshPayload;
    try {
      payload = jwt.verify(refreshToken, config.auth.refreshSecret) as JwtRefreshPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const stored = await this.authRepo.findRefreshToken(refreshToken);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    const user = await this.authRepo.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account not found');
    }

    await this.authRepo.deleteRefreshToken(refreshToken);
    return this.generateAndStoreTokens(user.id, user.email);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.authRepo.deleteRefreshToken(refreshToken);
    } catch {
      // Already logged out
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepo.deleteAllRefreshTokens(userId);
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload: JwtAccessPayload = { sub: userId, email };
    const options = { expiresIn: config.auth.accessExpiresIn };
    return jwt.sign(payload, config.auth.accessSecret, options as SignOptions);
  }

  private async generateAndStoreTokens(userId: string, email: string): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(userId, email);

    const tokenId = uuidv4();
    const refreshPayload: JwtRefreshPayload = { sub: userId, tokenId };
    const refreshOptions = { expiresIn: config.auth.refreshExpiresIn };
    const refreshToken = jwt.sign(refreshPayload, config.auth.refreshSecret, refreshOptions as SignOptions);

    const decoded = jwt.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await this.authRepo.createRefreshToken({ userId, token: refreshToken, expiresAt });

    return { accessToken, refreshToken };
  }
}

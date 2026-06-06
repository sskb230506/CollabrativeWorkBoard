// ─────────────────────────────────────────────────────────────────────────────
// Global TypeScript augmentations & shared types
// ─────────────────────────────────────────────────────────────────────────────

// ── Express Request augmentation ─────────────────────────────────────────────
// Extends the Express Request type so every controller has typed access to
// the authenticated user and the resolved tenant (organization).
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
      membership?: OrganizationMembership;
    }
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface JwtAccessPayload {
  sub: string;   // userId
  email: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;   // userId
  tokenId: string; // RefreshToken.id — allows server-side revocation
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Tenant / RBAC ─────────────────────────────────────────────────────────────

// Mirror of Prisma's OrganizationRole enum — kept in sync with schema.prisma
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface OrganizationMembership {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────

export interface SocketUser {
  userId: string;
  organizationId: string;
  name: string;
  avatarUrl: string | null;
}

// ── BullMQ Job Payloads ───────────────────────────────────────────────────────

export interface EmailJobPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface ActivityJobPayload {
  organizationId: string;
  userId: string;
  boardId?: string;
  cardId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationJobPayload {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
}

// ── Generic utility types ─────────────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
export type WithTimestamps = { createdAt: Date; updatedAt: Date };

// ── Repository interface ──────────────────────────────────────────────────────
// Every repository must implement this base contract.
export interface IBaseRepository<TEntity, TCreateInput, TUpdateInput> {
  findById(id: string): Promise<Nullable<TEntity>>;
  create(data: TCreateInput): Promise<TEntity>;
  update(id: string, data: TUpdateInput): Promise<TEntity>;
  delete(id: string): Promise<void>;
}

// ── Presence (real-time) ──────────────────────────────────────────────────────
export interface PresenceEntry {
  userId: string;
  name: string | undefined;
  avatarUrl: string | null | undefined;
  boardId: string | null;
  organizationId: string;
  socketId: string;
  lastSeen: number;
}


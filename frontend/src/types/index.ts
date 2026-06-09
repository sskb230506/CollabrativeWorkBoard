// ─────────────────────────────────────────────────────────────────────────────
// Global Domain Types
//
// These mirror the Prisma models on the backend. Keeping them in one place
// prevents duplicate type definitions scattered across features.
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitives ───────────────────────────────────────────────────────────────

export type Nullable<T> = T | null;

export type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
}>;

// ── Enums ────────────────────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type BoardVisibility = 'PUBLIC' | 'PRIVATE' | 'ORGANIZATION';
export type CardPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: Nullable<string>;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: Nullable<string>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  joinedAt: string;
}

// ── Board ─────────────────────────────────────────────────────────────────────

export interface Board {
  id: string;
  organizationId: string;
  name: string;
  description: Nullable<string>;
  coverUrl: Nullable<string>;
  visibility: BoardVisibility;
  createdAt: string;
  updatedAt: string;
}

// ── List ──────────────────────────────────────────────────────────────────────

export interface List {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// ── Card ──────────────────────────────────────────────────────────────────────

export interface CardAssignee {
  cardId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  assignedAt: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: Nullable<string>;
  position: number;
  priority: CardPriority;
  dueDate: Nullable<string>;
  coverUrl: Nullable<string>;
  assignees: CardAssignee[];
  createdAt: string;
  updatedAt: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

// ── Presence (real-time) ──────────────────────────────────────────────────────

export interface PresenceEntry {
  userId: string;
  name: string | undefined;
  avatarUrl: string | null | undefined;
  boardId: string;
  lastSeen: number;
}

// ── Comment ───────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  body: string;
  user: {
    id: string;
    name: string;
    avatarUrl: Nullable<string>;
  };
  createdAt: string;
  updatedAt: string;
}

// ── ActivityLog ───────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  organizationId: string;
  boardId: string | null;
  cardId: string | null;
  userId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  board?: {
    id: string;
    name: string;
  } | null;
  card?: {
    id: string;
    title: string;
  } | null;
}

// ── Board Workspace (composite) ───────────────────────────────────────────────

export interface BoardWithLists extends Board {
  lists: ListWithCards[];
}

export interface ListWithCards extends List {
  cards: Card[];
}

// ── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = 'assignment' | 'mention' | 'due_date_reminder';

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: Nullable<string>;
  body: string;
  isRead: boolean;
  metadata: Nullable<{
    cardId?: string;
    boardId?: string;
    commentId?: string;
    dueDate?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}


import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '@repositories/base.repository';
import { Nullable } from '@appTypes';

// Auth repository types (inline to avoid Prisma re-export issues)
type DbUser = Awaited<ReturnType<PrismaClient['user']['findUniqueOrThrow']>>;
type DbRefreshToken = Awaited<ReturnType<PrismaClient['refreshToken']['findUniqueOrThrow']>>;

type UserCreateInput = {
  email: string;
  name: string;
  passwordHash: string;
};

type UserUpdateInput = Partial<{
  name: string;
  avatarUrl: string;
  passwordHash: string;
  emailVerified: boolean;
}>;

export class AuthRepository extends BaseRepository<DbUser, UserCreateInput, UserUpdateInput> {
  protected readonly modelName = 'User';

  async findById(id: string): Promise<Nullable<DbUser>> {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Nullable<DbUser>> {
    return this.db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  }

  async create(data: UserCreateInput): Promise<DbUser> {
    return this.db.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim(),
      },
    });
  }

  async update(id: string, data: UserUpdateInput): Promise<DbUser> {
    return this.db.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }

  async createRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<DbRefreshToken> {
    return this.db.refreshToken.create({ data });
  }

  async findRefreshToken(token: string): Promise<Nullable<DbRefreshToken>> {
    return this.db.refreshToken.findUnique({ where: { token } });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.db.refreshToken.delete({ where: { token } });
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await this.db.refreshToken.deleteMany({ where: { userId } });
  }
}

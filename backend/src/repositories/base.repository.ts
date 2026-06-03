import { PrismaClient } from '@prisma/client';
import { prisma } from '../prisma/client';
import { IBaseRepository, Nullable } from '@appTypes';
import { NotFoundError } from '@lib/errors';

// ─────────────────────────────────────────────────────────────────────────────
// Base Repository
// ─────────────────────────────────────────────────────────────────────────────

export abstract class BaseRepository<
  TEntity,
  TCreateInput,
  TUpdateInput,
> implements IBaseRepository<TEntity, TCreateInput, TUpdateInput> {
  protected readonly db: PrismaClient;
  protected abstract readonly modelName: string;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  abstract findById(id: string): Promise<Nullable<TEntity>>;
  abstract create(data: TCreateInput): Promise<TEntity>;
  abstract update(id: string, data: TUpdateInput): Promise<TEntity>;
  abstract delete(id: string): Promise<void>;

  protected ensureExists<T>(entity: Nullable<T>, id?: string): T {
    if (entity === null || entity === undefined) {
      const detail = id ? ` (id: ${id})` : '';
      throw new NotFoundError(`${this.modelName}${detail}`);
    }
    return entity;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async withTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.db.$transaction(fn);
  }
}

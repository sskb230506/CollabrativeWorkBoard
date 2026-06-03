import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '@repositories/base.repository';
import { Nullable } from '@appTypes';

// Derive Prisma types inline to prevent export collision issues
type DbBoard = Awaited<ReturnType<PrismaClient['board']['findUniqueOrThrow']>>;

type BoardCreateInput = {
  organizationId: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ORGANIZATION';
};

type BoardUpdateInput = Partial<{
  name: string;
  description: string | null;
  coverUrl: string | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'ORGANIZATION';
}>;

export class BoardsRepository extends BaseRepository<
  DbBoard,
  BoardCreateInput,
  BoardUpdateInput
> {
  protected readonly modelName = 'Board';

  async findById(id: string): Promise<Nullable<DbBoard>> {
    return this.db.board.findUnique({ where: { id } });
  }

  async findByIdAndOrg(id: string, organizationId: string): Promise<Nullable<DbBoard>> {
    return this.db.board.findFirst({
      where: { id, organizationId },
    });
  }

  async listBoards(organizationId: string): Promise<DbBoard[]> {
    return this.db.board.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: BoardCreateInput): Promise<DbBoard> {
    return this.db.board.create({ data });
  }

  async update(id: string, data: BoardUpdateInput): Promise<DbBoard> {
    return this.db.board.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.board.delete({ where: { id } });
  }

  async updateScoped(
    id: string,
    organizationId: string,
    data: BoardUpdateInput,
  ): Promise<DbBoard> {
    return this.db.board.update({
      where: { id, organizationId },
      data,
    });
  }

  async deleteScoped(id: string, organizationId: string): Promise<void> {
    await this.db.board.delete({
      where: { id, organizationId },
    });
  }
}

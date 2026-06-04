import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '@repositories/base.repository';
import { Nullable } from '@appTypes';

type DbList = Awaited<ReturnType<PrismaClient['list']['findUniqueOrThrow']>>;

type ListCreateInput = {
  boardId: string;
  name: string;
  position: number;
};

type ListUpdateInput = Partial<{
  name: string;
  position: number;
}>;

export class ListsRepository extends BaseRepository<
  DbList,
  ListCreateInput,
  ListUpdateInput
> {
  protected readonly modelName = 'List';

  async findById(id: string): Promise<Nullable<DbList>> {
    return this.db.list.findUnique({ where: { id } });
  }

  async findByIdScoped(
    id: string,
    boardId: string,
    organizationId: string,
  ): Promise<Nullable<DbList>> {
    return this.db.list.findFirst({
      where: {
        id,
        boardId,
        board: {
          organizationId,
        },
      },
    });
  }

  async listLists(boardId: string, organizationId: string): Promise<DbList[]> {
    return this.db.list.findMany({
      where: {
        boardId,
        board: {
          organizationId,
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async create(data: ListCreateInput): Promise<DbList> {
    return this.db.list.create({ data });
  }

  async update(id: string, data: ListUpdateInput): Promise<DbList> {
    return this.db.list.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.list.delete({ where: { id } });
  }

  async updateScoped(
    id: string,
    boardId: string,
    organizationId: string,
    data: ListUpdateInput,
  ): Promise<DbList> {
    return this.db.list.update({
      where: {
        id,
        boardId,
        board: {
          organizationId,
        },
      },
      data,
    });
  }

  async deleteScoped(id: string, boardId: string, organizationId: string): Promise<void> {
    // Delete scoped ensures tenant check matches and deletes the list
    await this.db.list.deleteMany({
      where: {
        id,
        boardId,
        board: {
          organizationId,
        },
      },
    });
  }
}

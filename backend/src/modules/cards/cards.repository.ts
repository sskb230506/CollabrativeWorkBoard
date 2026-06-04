import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from '@repositories/base.repository';
import { Nullable } from '@appTypes';

type DbCard = Awaited<
  ReturnType<
    PrismaClient['card']['findUniqueOrThrow'] & {
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true; name: true; email: true; avatarUrl: true };
            };
          };
        };
      };
    }
  >
>;

type CardCreateInput = {
  listId: string;
  title: string;
  description?: string | null;
  position: number;
  priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date | null;
  coverUrl?: string | null;
};

type CardUpdateInput = Partial<{
  listId: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: Date | null;
  coverUrl: string | null;
}>;

export class CardsRepository extends BaseRepository<
  DbCard,
  CardCreateInput,
  CardUpdateInput
> {
  protected readonly modelName = 'Card';

  async findById(id: string): Promise<Nullable<DbCard>> {
    // Basic find without full includes for typing base repo matching
    return this.db.card.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    }) as Promise<Nullable<DbCard>>;
  }

  async findByIdScoped(
    id: string,
    boardId: string,
    organizationId: string,
  ): Promise<Nullable<DbCard>> {
    return this.db.card.findFirst({
      where: {
        id,
        list: {
          boardId,
          board: {
            organizationId,
          },
        },
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    }) as Promise<Nullable<DbCard>>;
  }

  async listCards(boardId: string, organizationId: string): Promise<DbCard[]> {
    return this.db.card.findMany({
      where: {
        list: {
          boardId,
          board: {
            organizationId,
          },
        },
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    }) as Promise<DbCard[]>;
  }

  async create(data: CardCreateInput): Promise<DbCard> {
    return this.createCard(data, []);
  }

  async createCard(data: CardCreateInput, assigneeIds: string[]): Promise<DbCard> {
    return this.db.$transaction(async (tx) => {
      const createData: Prisma.CardUncheckedCreateInput = {
        listId: data.listId,
        title: data.title,
        position: data.position,
      };
      if (data.description !== undefined) createData.description = data.description;
      if (data.priority !== undefined) createData.priority = data.priority;
      if (data.dueDate !== undefined) createData.dueDate = data.dueDate;
      if (data.coverUrl !== undefined) createData.coverUrl = data.coverUrl;

      const card = await tx.card.create({
        data: createData,
      });

      if (assigneeIds.length > 0) {
        await tx.cardAssignee.createMany({
          data: assigneeIds.map((userId) => ({
            cardId: card.id,
            userId,
          })),
        });
      }

      return tx.card.findUniqueOrThrow({
        where: { id: card.id },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      }) as Promise<DbCard>;
    });
  }

  async update(id: string, data: CardUpdateInput): Promise<DbCard> {
    return this.updateScoped(id, '', '', data);
  }

  async updateScoped(
    id: string,
    boardId: string,
    organizationId: string,
    data: CardUpdateInput,
    assigneeIds?: string[],
  ): Promise<DbCard> {
    return this.db.$transaction(async (tx) => {
      // Build where clause based on whether scoping checks are needed
      const whereClause = boardId
        ? {
            id,
            list: {
              boardId,
              board: {
                organizationId,
              },
            },
          }
        : { id };

      const updateData: Prisma.CardUncheckedUpdateInput = {};
      if (data.listId !== undefined) updateData.listId = data.listId;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.position !== undefined) updateData.position = data.position;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;

      await tx.card.update({
        where: whereClause,
        data: updateData,
      });

      if (assigneeIds !== undefined) {
        // Sync assignees: delete existing and recreate
        await tx.cardAssignee.deleteMany({ where: { cardId: id } });
        if (assigneeIds.length > 0) {
          await tx.cardAssignee.createMany({
            data: assigneeIds.map((userId) => ({
              cardId: id,
              userId,
            })),
          });
        }
      }

      return tx.card.findUniqueOrThrow({
        where: { id },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      }) as Promise<DbCard>;
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.card.delete({ where: { id } });
  }

  async deleteScoped(id: string, boardId: string, organizationId: string): Promise<void> {
    await this.db.card.deleteMany({
      where: {
        id,
        list: {
          boardId,
          board: {
            organizationId,
          },
        },
      },
    });
  }
}

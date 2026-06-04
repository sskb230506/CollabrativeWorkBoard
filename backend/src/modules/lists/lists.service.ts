import { ListsRepository } from './lists.repository';
import { CreateListInput, UpdateListInput } from './lists.schema';
import { NotFoundError } from '@lib/errors';
import { List } from '@prisma/client';
import { prisma } from '../../prisma/client';

export class ListsService {
  constructor(private readonly listsRepo: ListsRepository) {}

  /**
   * Helper to verify a board exists and belongs to the given organization
   */
  private async verifyBoardExists(boardId: string, organizationId: string): Promise<void> {
    const board = await prisma.board.findFirst({
      where: { id: boardId, organizationId },
    });
    if (!board) {
      throw new NotFoundError('Board');
    }
  }

  /**
   * Creates a new list on a board
   */
  async createList(
    organizationId: string,
    boardId: string,
    input: CreateListInput,
  ): Promise<List> {
    await this.verifyBoardExists(boardId, organizationId);

    let position = input.position;
    if (position === undefined) {
      const existingLists = await this.listsRepo.listLists(boardId, organizationId);
      if (existingLists.length === 0) {
        position = 1000;
      } else {
        const maxPos = Math.max(...existingLists.map((l) => l.position));
        position = maxPos + 1000;
      }
    }

    return this.listsRepo.create({
      boardId,
      name: input.name,
      position,
    });
  }

  /**
   * Lists all lists in a board
   */
  async listLists(organizationId: string, boardId: string): Promise<List[]> {
    await this.verifyBoardExists(boardId, organizationId);
    return this.listsRepo.listLists(boardId, organizationId);
  }

  /**
   * Gets list details scoped to board and organization
   */
  async getList(organizationId: string, boardId: string, listId: string): Promise<List> {
    await this.verifyBoardExists(boardId, organizationId);
    const list = await this.listsRepo.findByIdScoped(listId, boardId, organizationId);
    if (!list) {
      throw new NotFoundError('List');
    }
    return list;
  }

  /**
   * Updates an existing list
   */
  async updateList(
    organizationId: string,
    boardId: string,
    listId: string,
    input: UpdateListInput,
  ): Promise<List> {
    await this.getList(organizationId, boardId, listId); // throws if not found

    const updateData: { name?: string; position?: number } = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.position !== undefined) {
      updateData.position = input.position;
    }

    return this.listsRepo.updateScoped(listId, boardId, organizationId, updateData);
  }

  /**
   * Deletes a list
   */
  async deleteList(organizationId: string, boardId: string, listId: string): Promise<void> {
    await this.getList(organizationId, boardId, listId); // throws if not found
    await this.listsRepo.deleteScoped(listId, boardId, organizationId);
  }
}

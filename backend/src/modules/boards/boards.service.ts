import { BoardsRepository } from './boards.repository';
import { CreateBoardInput, UpdateBoardInput } from './boards.schema';
import { NotFoundError } from '@lib/errors';
import { Board } from '@prisma/client';

export class BoardsService {
  constructor(private readonly boardsRepo: BoardsRepository) {}

  /**
   * Creates a new board scoped to an organization
   */
  async createBoard(organizationId: string, input: CreateBoardInput): Promise<Board> {
    const createData = {
      organizationId,
      name: input.name,
      description: input.description ?? null,
      coverUrl: input.coverUrl ?? null,
      visibility: input.visibility,
    };

    return this.boardsRepo.create(createData);
  }

  /**
   * Lists all boards belonging to an organization
   */
  async listBoards(organizationId: string): Promise<Board[]> {
    return this.boardsRepo.listBoards(organizationId);
  }

  /**
   * Retrieves a single board by ID, scoped to organization
   */
  async getBoard(organizationId: string, boardId: string): Promise<Board> {
    const board = await this.boardsRepo.findByIdAndOrg(boardId, organizationId);
    if (!board) {
      throw new NotFoundError('Board');
    }
    return board;
  }

  /**
   * Updates an existing board
   */
  async updateBoard(
    organizationId: string,
    boardId: string,
    input: UpdateBoardInput,
  ): Promise<Board> {
    await this.getBoard(organizationId, boardId); // throws if not found/accessible

    const updateData: {
      name?: string;
      description?: string | null;
      coverUrl?: string | null;
      visibility?: 'PUBLIC' | 'PRIVATE' | 'ORGANIZATION';
    } = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.coverUrl !== undefined) {
      updateData.coverUrl = input.coverUrl;
    }
    if (input.visibility !== undefined) {
      updateData.visibility = input.visibility;
    }

    return this.boardsRepo.updateScoped(boardId, organizationId, updateData);
  }

  /**
   * Deletes a board
   */
  async deleteBoard(organizationId: string, boardId: string): Promise<void> {
    await this.getBoard(organizationId, boardId); // throws if not found/accessible
    await this.boardsRepo.deleteScoped(boardId, organizationId);
  }
}

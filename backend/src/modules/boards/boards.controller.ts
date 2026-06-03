import { Request, Response } from 'express';
import { BoardsService } from './boards.service';
import { sendSuccess, sendCreated, asyncHandler } from '@lib/api.helpers';
import { CreateBoardInput, UpdateBoardInput } from './boards.schema';

export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.boardsService.createBoard(
      req.organizationId!,
      req.body as CreateBoardInput,
    );
    return sendCreated(res, result, 'Board created successfully');
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.boardsService.listBoards(req.organizationId!);
    return sendSuccess(res, result, 200, 'Boards retrieved successfully');
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.boardsService.getBoard(
      req.organizationId!,
      req.params['boardId']!,
    );
    return sendSuccess(res, result, 200, 'Board details retrieved');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.boardsService.updateBoard(
      req.organizationId!,
      req.params['boardId']!,
      req.body as UpdateBoardInput,
    );
    return sendSuccess(res, result, 200, 'Board updated successfully');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.boardsService.deleteBoard(req.organizationId!, req.params['boardId']!);
    return sendSuccess(res, null, 200, 'Board deleted successfully');
  });
}

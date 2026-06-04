import { Request, Response } from 'express';
import { ListsService } from './lists.service';
import { sendSuccess, sendCreated, asyncHandler } from '@lib/api.helpers';
import { CreateListInput, UpdateListInput } from './lists.schema';

export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const { boardId } = req.params as { boardId: string };
    const result = await this.listsService.createList(
      req.organizationId!,
      boardId,
      req.body as CreateListInput,
    );
    return sendCreated(res, result, 'List created successfully');
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const { boardId } = req.params as { boardId: string };
    const result = await this.listsService.listLists(req.organizationId!, boardId);
    return sendSuccess(res, result, 200, 'Lists retrieved successfully');
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const { boardId, listId } = req.params as { boardId: string; listId: string };
    const result = await this.listsService.getList(req.organizationId!, boardId, listId);
    return sendSuccess(res, result, 200, 'List details retrieved');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { boardId, listId } = req.params as { boardId: string; listId: string };
    const result = await this.listsService.updateList(
      req.organizationId!,
      boardId,
      listId,
      req.body as UpdateListInput,
    );
    return sendSuccess(res, result, 200, 'List updated successfully');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { boardId, listId } = req.params as { boardId: string; listId: string };
    await this.listsService.deleteList(req.organizationId!, boardId, listId);
    return sendSuccess(res, null, 200, 'List deleted successfully');
  });
}

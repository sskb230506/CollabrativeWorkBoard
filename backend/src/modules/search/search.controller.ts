import { Request, Response } from 'express';
import { SearchService } from './search.service';
import { asyncHandler, sendSuccess } from '../../lib/api.helpers';

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  search = asyncHandler(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { q } = req.query;

    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    const searchQuery = typeof q === 'string' ? q : '';
    const results = await this.searchService.search(organizationId, searchQuery);

    return sendSuccess(res, results, 200, 'Search results retrieved successfully');
  });
}

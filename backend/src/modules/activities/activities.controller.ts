import { Request, Response } from 'express';
import { activitiesService } from './activities.service';
import { sendSuccess, asyncHandler } from '../../lib/api.helpers';

export class ActivitiesController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const activities = await activitiesService.list(req.organizationId!, limit);
    return sendSuccess(res, activities, 200, 'Activities retrieved successfully');
  });
}

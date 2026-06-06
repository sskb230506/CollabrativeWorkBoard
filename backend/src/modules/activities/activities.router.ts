import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';
import { ActivitiesController } from './activities.controller';

const activitiesController = new ActivitiesController();

export const activitiesRouter = Router();

activitiesRouter.use(authenticate);

activitiesRouter.get(
  '/:organizationId/activities',
  resolveTenant,
  requireMember,
  activitiesController.list,
);

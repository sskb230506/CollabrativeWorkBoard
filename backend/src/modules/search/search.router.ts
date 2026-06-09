import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';
import { SearchRepository } from './search.repository';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

const searchRepository = new SearchRepository();
const searchService = new SearchService(searchRepository);
const searchController = new SearchController(searchService);

export const searchRouter = Router();

searchRouter.use(authenticate);

// GET /:organizationId/search — search boards, cards, comments, and users
searchRouter.get(
  '/:organizationId/search',
  resolveTenant,
  requireMember,
  searchController.search,
);

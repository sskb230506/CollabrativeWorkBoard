import { Router } from 'express';
import { healthRouter } from '@modules/health/health.router';
import { authRouter } from '@modules/auth/auth.router';
import { organizationsRouter } from '@modules/organizations/organizations.router';
import { boardsRouter } from '@modules/boards/boards.router';
import { listsRouter } from '@modules/lists/lists.router';
import { cardsRouter } from '@modules/cards/cards.router';
import { commentsRouter } from '@modules/comments/comments.router';

// ─────────────────────────────────────────────────────────────────────────────
// API Router (v1)
//
// Single registration point for all versioned routes.
// Adding a new module = one line here + the router file.
// ─────────────────────────────────────────────────────────────────────────────

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', organizationsRouter);

// Board, list, and card routes are nested under organizations for tenant context
// e.g. /api/v1/organizations/:organizationId/boards/:boardId/lists
apiRouter.use('/organizations', boardsRouter);
apiRouter.use('/organizations', listsRouter);
apiRouter.use('/organizations', cardsRouter);
apiRouter.use('/organizations', commentsRouter);


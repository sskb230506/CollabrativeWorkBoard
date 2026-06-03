import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';

export const cardsRouter = Router();
cardsRouter.use(authenticate);

// Cards are accessed within a board, within an org
cardsRouter.get('/:organizationId/boards/:boardId/cards', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

cardsRouter.post('/:organizationId/boards/:boardId/cards', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

cardsRouter.get('/:organizationId/boards/:boardId/cards/:cardId', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

cardsRouter.patch('/:organizationId/boards/:boardId/cards/:cardId', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

cardsRouter.delete('/:organizationId/boards/:boardId/cards/:cardId', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// Card move endpoint (cross-list)
cardsRouter.patch('/:organizationId/boards/:boardId/cards/:cardId/move', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

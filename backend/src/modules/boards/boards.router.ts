import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';

export const boardsRouter = Router();
boardsRouter.use(authenticate);

boardsRouter.get('/:organizationId/boards', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

boardsRouter.post('/:organizationId/boards', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

boardsRouter.get('/:organizationId/boards/:boardId', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

boardsRouter.patch('/:organizationId/boards/:boardId', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

boardsRouter.delete('/:organizationId/boards/:boardId', resolveTenant, requireMember, (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

import { z } from 'zod';

export const CreateCardSchema = z.object({
  listId: z.string().uuid('Invalid list ID'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().max(2000).optional().nullable(),
  position: z.number().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const).default('NONE'),
  dueDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date().optional().nullable(),
  ),
  coverUrl: z.string().url('Invalid cover URL').max(500).optional().nullable(),
  assigneeIds: z.array(z.string().uuid('Invalid user ID')).optional(),
});

export const UpdateCardSchema = z.object({
  listId: z.string().uuid('Invalid list ID').optional(),
  title: z.string().min(2, 'Title must be at least 2 characters').max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  position: z.number().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const).optional(),
  dueDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date().optional().nullable(),
  ),
  coverUrl: z.string().url('Invalid cover URL').max(500).optional().nullable(),
  assigneeIds: z.array(z.string().uuid('Invalid user ID')).optional(),
});

export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;

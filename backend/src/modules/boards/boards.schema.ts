import { z } from 'zod';

export const CreateBoardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  coverUrl: z.string().url('Invalid cover image URL').max(500).optional().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'ORGANIZATION'] as const).default('PRIVATE'),
});

export const UpdateBoardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  coverUrl: z.string().url('Invalid cover image URL').max(500).optional().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'ORGANIZATION'] as const).optional(),
});

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;

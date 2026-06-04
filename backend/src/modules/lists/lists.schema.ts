import { z } from 'zod';

export const CreateListSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  position: z.number().optional(),
});

export const UpdateListSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  position: z.number().optional(),
});

export type CreateListInput = z.infer<typeof CreateListSchema>;
export type UpdateListInput = z.infer<typeof UpdateListSchema>;

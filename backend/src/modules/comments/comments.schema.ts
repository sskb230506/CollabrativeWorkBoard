import { z } from 'zod';

export const CreateCommentSchema = z.object({
  body: z
    .string({ required_error: 'Comment body is required' })
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment is too long'),
});

export const UpdateCommentSchema = z.object({
  body: z
    .string({ required_error: 'Comment body is required' })
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment is too long'),
});

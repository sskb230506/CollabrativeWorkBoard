import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  logoUrl: z.string().url('Invalid logo URL').max(500).optional().nullable(),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  logoUrl: z.string().url('Invalid logo URL').max(500).optional().nullable(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const, {
    errorMap: () => ({ message: 'Invalid role. Must be ADMIN, MEMBER, or VIEWER' }),
  }),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

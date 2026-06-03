import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireAdmin, requireMember, requireOwner } from '@middleware/rbac.middleware';
import { validate } from '@middleware/validate.middleware';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { CreateOrganizationSchema, UpdateOrganizationSchema, InviteMemberSchema } from './organizations.schema';
import { z } from 'zod';

const orgRepository = new OrganizationsRepository();
const orgService = new OrganizationsService(orgRepository);
const orgController = new OrganizationsController(orgService);

export const organizationsRouter = Router();

// All organization routes require user authentication
organizationsRouter.use(authenticate);

// GET /organizations — list user's organizations
organizationsRouter.get('/', orgController.list);

// POST /organizations — create organization
organizationsRouter.post('/', validate({ body: CreateOrganizationSchema }), orgController.create);

// POST /organizations/invitations/accept — accept invitation to join organization
organizationsRouter.post(
  '/invitations/accept',
  validate({
    body: z.object({
      token: z.string().min(1, 'Token is required'),
    }),
  }),
  orgController.acceptInvite,
);

// Routes below require tenant context (organizationId in route params)
// GET /organizations/:organizationId — get details
organizationsRouter.get('/:organizationId', resolveTenant, requireMember, orgController.get);

// PATCH /organizations/:organizationId — update organization
organizationsRouter.patch(
  '/:organizationId',
  resolveTenant,
  requireAdmin,
  validate({ body: UpdateOrganizationSchema }),
  orgController.update,
);

// DELETE /organizations/:organizationId — delete organization (owner only)
organizationsRouter.delete('/:organizationId', resolveTenant, requireOwner, orgController.delete);

// GET /organizations/:organizationId/members — list members
organizationsRouter.get('/:organizationId/members', resolveTenant, requireMember, orgController.listMembers);

// POST /organizations/:organizationId/invite — invite a member
organizationsRouter.post(
  '/:organizationId/invite',
  resolveTenant,
  requireAdmin,
  validate({ body: InviteMemberSchema }),
  orgController.invite,
);

// DELETE /organizations/:organizationId/members/:userId — remove a member (kick or leave)
organizationsRouter.delete('/:organizationId/members/:userId', resolveTenant, orgController.removeMember);

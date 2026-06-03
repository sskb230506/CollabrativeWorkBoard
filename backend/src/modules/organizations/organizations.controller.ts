import { Request, Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { sendSuccess, sendCreated, asyncHandler } from '@lib/api.helpers';
import { CreateOrganizationInput, UpdateOrganizationInput, InviteMemberInput } from './organizations.schema';

export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.orgService.createOrganization(
      req.user!.id,
      req.body as CreateOrganizationInput,
    );
    return sendCreated(res, result, 'Organization created successfully');
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.orgService.listUserOrganizations(req.user!.id);
    return sendSuccess(res, result, 200, 'Organizations retrieved successfully');
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.orgService.getOrganization(req.params['organizationId']!);
    return sendSuccess(res, result, 200, 'Organization details retrieved');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.orgService.updateOrganization(
      req.params['organizationId']!,
      req.body as UpdateOrganizationInput,
    );
    return sendSuccess(res, result, 200, 'Organization updated successfully');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.orgService.deleteOrganization(req.params['organizationId']!);
    return sendSuccess(res, null, 200, 'Organization deleted successfully');
  });

  listMembers = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.orgService.listMembers(req.params['organizationId']!);
    return sendSuccess(res, result, 200, 'Organization members list retrieved');
  });

  invite = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.orgService.inviteMember(
      req.params['organizationId']!,
      req.user!.email,
      req.body as InviteMemberInput,
    );
    return sendCreated(res, result, 'Invitation sent successfully');
  });

  acceptInvite = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body as { token: string };
    const result = await this.orgService.acceptInvitation(token, req.user!.id, req.user!.email);
    return sendSuccess(res, result, 200, 'Invitation accepted and joined organization');
  });

  removeMember = asyncHandler(async (req: Request, res: Response) => {
    await this.orgService.removeMember(
      req.params['organizationId']!,
      req.user!.id,
      req.params['userId']!,
    );
    return sendSuccess(res, null, 200, 'Member removed from organization');
  });
}

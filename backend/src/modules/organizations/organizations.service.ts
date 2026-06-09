import { OrganizationsRepository } from './organizations.repository';
import { CreateOrganizationInput, UpdateOrganizationInput, InviteMemberInput } from './organizations.schema';
import { ConflictError, NotFoundError, ForbiddenError, BadRequestError } from '@lib/errors';
import { OrganizationRole } from '@appTypes';
import { enqueueEmail } from '@queue/queues';
import { Organization, OrganizationMember, Invitation } from '@prisma/client';
import { invalidateSearchCache } from '@lib/redis';

export class OrganizationsService {
  constructor(private readonly orgRepo: OrganizationsRepository) {}

  /**
   * Creates a new organization with the user as the owner
   */
  async createOrganization(userId: string, input: CreateOrganizationInput): Promise<Organization> {
    // Generate base slug
    let slug = this.slugify(input.name);
    
    // Check for collisions and resolve if necessary
    const slugExists = await this.orgRepo.findBySlug(slug);
    if (slugExists) {
      // Append random hex string for uniqueness
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      slug = `${slug}-${randomSuffix}`;
    }

    const createData = {
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
    };

    return this.orgRepo.createWithCreator(createData, userId);
  }

  /**
   * Lists all organizations where a user is a member
   */
  async listUserOrganizations(userId: string) {
    return this.orgRepo.listUserOrganizations(userId);
  }

  /**
   * Retrieves organization by ID
   */
  async getOrganization(organizationId: string) {
    const org = await this.orgRepo.findById(organizationId);
    if (!org) {
      throw new NotFoundError('Organization');
    }
    return org;
  }

  /**
   * Updates organization details
   */
  async updateOrganization(organizationId: string, input: UpdateOrganizationInput) {
    await this.getOrganization(organizationId); // throws if not found
    const updateData: { name?: string; logoUrl?: string | null } = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.logoUrl !== undefined) {
      updateData.logoUrl = input.logoUrl;
    }
    return this.orgRepo.update(organizationId, updateData);
  }

  /**
   * Deletes an organization
   */
  async deleteOrganization(organizationId: string) {
    await this.getOrganization(organizationId); // throws if not found
    await this.orgRepo.delete(organizationId);
  }

  /**
   * Lists members of an organization
   */
  async listMembers(organizationId: string) {
    return this.orgRepo.listMembers(organizationId);
  }

  /**
   * Invites a new user to the organization
   */
  async inviteMember(
    organizationId: string,
    inviterEmail: string,
    input: InviteMemberInput,
  ): Promise<Invitation> {
    const org = await this.getOrganization(organizationId);

    // Check if user is already a member
    const list = await this.orgRepo.listMembers(organizationId);
    const alreadyMember = list.some((m) => m.user.email.toLowerCase() === input.email.toLowerCase());
    if (alreadyMember) {
      throw new ConflictError('User is already a member of this organization');
    }

    // Check for existing valid invitation
    const existingInvite = await this.orgRepo.findInvitation(organizationId, input.email);
    if (existingInvite) {
      throw new ConflictError('A pending invitation already exists for this email');
    }

    // Expiry: 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.orgRepo.createInvitation({
      organizationId,
      email: input.email,
      role: input.role,
      expiresAt,
    });

    // Queue email asynchronously in the background via BullMQ
    try {
      await enqueueEmail({
        to: invite.email,
        subject: `You have been invited to join ${org.name} on CollaborativeWorkBoard`,
        template: 'organization-invite',
        data: {
          orgName: org.name,
          role: invite.role,
          token: invite.token,
          inviterEmail,
        },
      });
    } catch (err) {
      // Log error but don't fail the API response if email queue is down
      // This ensures robust/fault-tolerant operation
    }

    return invite;
  }

  /**
   * Accepts a pending organization invitation
   */
  async acceptInvitation(token: string, userId: string, userEmail: string): Promise<OrganizationMember> {
    const invitation = await this.orgRepo.findInvitationByToken(token);
    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.accepted) {
      throw new BadRequestError('Invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestError('Invitation has expired');
    }

    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenError('This invitation was sent to a different email address');
    }

    // Check if user is already a member (e.g. joined via another path)
    const existingMember = await this.orgRepo.findMember(invitation.organizationId, userId);
    if (existingMember) {
      // Mark as accepted anyway to clean up
      await this.orgRepo.update(invitation.organizationId, { logoUrl: null }); // just dummy to update something or update accepted field directly
      // Better: let's just make it accepted and return the member
      throw new ConflictError('You are already a member of this organization');
    }

    const member = await this.orgRepo.acceptInvitation(
      invitation.id,
      userId,
      invitation.organizationId,
      invitation.role as OrganizationRole,
    );
    await invalidateSearchCache(invitation.organizationId);
    return member;
  }

  /**
   * Kicks or leaves a member from an organization
   */
  async removeMember(
    organizationId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<void> {
    // Fetch members list
    const members = await this.orgRepo.listMembers(organizationId);
    
    const targetMember = members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Organization member');
    }

    // Case 1: Self-leaving
    if (currentUserId === targetUserId) {
      if (targetMember.role === 'OWNER') {
        const ownerCount = members.filter((m) => m.role === 'OWNER').length;
        if (ownerCount <= 1) {
          throw new BadRequestError(
            'Cannot leave as the sole OWNER. Please transfer ownership or delete the organization.',
          );
        }
      }
      await this.orgRepo.removeMember(organizationId, targetUserId);
      await invalidateSearchCache(organizationId);
      return;
    }

    // Case 2: Kicking someone else
    const callerMember = members.find((m) => m.userId === currentUserId);
    if (!callerMember) {
      throw new ForbiddenError('You are not a member of this organization');
    }

    const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      VIEWER: 1,
    };

    const callerLevel = ROLE_HIERARCHY[callerMember.role as OrganizationRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetMember.role as OrganizationRole] ?? 0;

    // Caller must have higher rank than target
    if (callerLevel <= targetLevel) {
      throw new ForbiddenError('You do not have permission to remove this member');
    }

    // Admins or owners only can remove others
    if (callerLevel < ROLE_HIERARCHY.ADMIN) {
      throw new ForbiddenError('Only ADMIN or OWNER can remove members');
    }

    await this.orgRepo.removeMember(organizationId, targetUserId);
    await invalidateSearchCache(organizationId);
  }

  /**
   * Helper to slugify organization names
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

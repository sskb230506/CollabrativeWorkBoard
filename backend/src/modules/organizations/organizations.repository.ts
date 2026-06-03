import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '@repositories/base.repository';
import { Nullable, OrganizationRole } from '@appTypes';

// Derive Prisma types inline to prevent export collision issues
type DbOrganization = Awaited<ReturnType<PrismaClient['organization']['findUniqueOrThrow']>>;
type DbMember = Awaited<ReturnType<PrismaClient['organizationMember']['findUniqueOrThrow']>>;
type DbInvitation = Awaited<ReturnType<PrismaClient['invitation']['findUniqueOrThrow']>>;

type OrganizationCreateInput = {
  name: string;
  slug: string;
  logoUrl?: string | null;
};

type OrganizationUpdateInput = Partial<{
  name: string;
  logoUrl: string | null;
}>;

export class OrganizationsRepository extends BaseRepository<
  DbOrganization,
  OrganizationCreateInput,
  OrganizationUpdateInput
> {
  protected readonly modelName = 'Organization';

  async findById(id: string): Promise<Nullable<DbOrganization>> {
    return this.db.organization.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Nullable<DbOrganization>> {
    return this.db.organization.findUnique({ where: { slug } });
  }

  async create(data: OrganizationCreateInput): Promise<DbOrganization> {
    return this.db.organization.create({ data });
  }

  async update(id: string, data: OrganizationUpdateInput): Promise<DbOrganization> {
    return this.db.organization.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.organization.delete({ where: { id } });
  }

  /**
   * Creates an organization and its OWNER member in a single transaction
   */
  async createWithCreator(
    data: OrganizationCreateInput,
    creatorUserId: string,
  ): Promise<DbOrganization> {
    return this.db.$transaction(async (tx) => {
      const org = await tx.organization.create({ data });
      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: creatorUserId,
          role: 'OWNER',
        },
      });
      return org;
    });
  }

  /**
   * Lists all organizations where a user is a member
   */
  async listUserOrganizations(userId: string): Promise<DbOrganization[]> {
    return this.db.organization.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lists all members of an organization with user details
   */
  async listMembers(
    organizationId: string,
  ): Promise<
    (DbMember & {
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
    })[]
  > {
    return this.db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Finds a specific membership of a user in an organization
   */
  async findMember(organizationId: string, userId: string): Promise<Nullable<DbMember>> {
    return this.db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  /**
   * Removes a member from an organization
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    await this.db.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  /**
   * Creates a pending invitation
   */
  async createInvitation(data: {
    organizationId: string;
    email: string;
    role: OrganizationRole;
    expiresAt: Date;
  }): Promise<DbInvitation> {
    return this.db.invitation.create({
      data: {
        organizationId: data.organizationId,
        email: data.email.toLowerCase().trim(),
        role: data.role,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Finds a pending invitation by its token
   */
  async findInvitationByToken(token: string): Promise<Nullable<DbInvitation>> {
    return this.db.invitation.findUnique({ where: { token } });
  }

  /**
   * Finds a pending invitation by email and organizationId
   */
  async findInvitation(organizationId: string, email: string): Promise<Nullable<DbInvitation>> {
    return this.db.invitation.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase().trim(),
        accepted: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Accepts an invitation in a transaction: marks it as accepted and creates the membership record
   */
  async acceptInvitation(
    invitationId: string,
    userId: string,
    organizationId: string,
    role: OrganizationRole,
  ): Promise<DbMember> {
    return this.db.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { accepted: true },
      });

      return tx.organizationMember.create({
        data: {
          organizationId,
          userId,
          role,
        },
      });
    });
  }
}

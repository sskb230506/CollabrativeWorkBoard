import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { ForbiddenError, UnauthorizedError, NotFoundError } from '@lib/errors';
import { OrganizationMembership, OrganizationRole } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Resolution Middleware
// ─────────────────────────────────────────────────────────────────────────────

export const resolveTenant = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  void (async () => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required before tenant resolution');
      }

      const organizationId =
        req.params['organizationId'] ??
        (req.headers['x-organization-id'] as string | undefined);

      if (!organizationId) {
        throw new ForbiddenError('Organization context required');
      }

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
      });

      if (!org) {
        throw new NotFoundError('Organization');
      }

      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: req.user.id,
          },
        },
        select: { organizationId: true, userId: true, role: true },
      });

      if (!membership) {
        throw new ForbiddenError('You are not a member of this organization');
      }

      const orgMembership: OrganizationMembership = {
        organizationId: membership.organizationId,
        userId: membership.userId,
        role: membership.role as OrganizationRole,
      };

      req.organizationId = organizationId;
      req.membership = orgMembership;

      next();
    } catch (err) {
      next(err);
    }
  })();
};

// ─────────────────────────────────────────────────────────────────────────────
// RBAC Middleware Factory
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const requireRole = (...roles: OrganizationRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const membership = req.membership;

    if (!membership) {
      return next(new ForbiddenError('Organization membership required'));
    }

    const userLevel = ROLE_HIERARCHY[membership.role] ?? 0;
    const minRequired = Math.min(...roles.map((r) => ROLE_HIERARCHY[r] ?? 0));

    if (userLevel < minRequired) {
      return next(
        new ForbiddenError(
          `Requires one of: ${roles.join(', ')}. Your role: ${membership.role}`,
        ),
      );
    }

    next();
  };
};

export const requireOwner = requireRole('OWNER');
export const requireAdmin = requireRole('ADMIN', 'OWNER');
export const requireMember = requireRole('MEMBER', 'ADMIN', 'OWNER');

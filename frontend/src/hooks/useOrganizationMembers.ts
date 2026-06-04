import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@api/organizations.api';
import { queryKeys } from '@api/query-keys';

// ─────────────────────────────────────────────────────────────────────────────
// useOrganizationMembers
//
// Fetches the members list of the specified organization.
// ─────────────────────────────────────────────────────────────────────────────

export const useOrganizationMembers = (orgId: string) =>
  useQuery({
    queryKey: queryKeys.organizations.members(orgId),
    queryFn: () => organizationsApi.listMembers(orgId),
    enabled: !!orgId,
  });

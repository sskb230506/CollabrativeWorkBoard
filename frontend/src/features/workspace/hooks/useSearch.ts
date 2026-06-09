import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@api/search.api';

export const useSearch = (orgId: string | null, query: string) => {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ['search', orgId, normalizedQuery.toLowerCase()],
    queryFn: () => searchApi.execute(orgId!, normalizedQuery),
    enabled: !!orgId && normalizedQuery.length >= 2,
    staleTime: 10000, // Keep search results cache in react-query for 10s
  });
};

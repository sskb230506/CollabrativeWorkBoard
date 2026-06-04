import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ─────────────────────────────────────────────────────────────────────────────
// React Query Client Configuration
//
// Design decisions:
//   - `staleTime: 60s` prevents over-fetching. Board data is valid for a
//     minute; real-time socket events invalidate specific keys immediately.
//   - `retry: 1` avoids hammering a dead API on failures.
//   - `refetchOnWindowFocus: false` prevents jarring re-renders when users
//     switch tabs — socket events keep data fresh instead.
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable-next-line react-refresh/only-export-components */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute
      gcTime: 5 * 60 * 1000,       // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);

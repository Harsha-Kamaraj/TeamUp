import { QueryClient } from '@tanstack/react-query';

/**
 * Single TanStack Query client for the app. Sensible defaults:
 * - don't refetch on every window focus (less noisy)
 * - retry once on failure
 * - cache data as "fresh" for 30s to avoid redundant requests
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

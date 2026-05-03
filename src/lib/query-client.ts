import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 2 minutes — avoids redundant refetches on
      // every navigation while still staying reasonably up to date.
      staleTime: 1000 * 60 * 2,

      // Keep unused query data in memory for 10 minutes so navigating
      // back to a page shows cached data instantly while revalidating.
      gcTime: 1000 * 60 * 10,

      // Refetch when the window regains focus (user switches tabs/apps)
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is still fresh — avoids waterfall
      // requests when navigating between pages.
      refetchOnMount: true,

      // Retry once on network failure; don't hammer a dead connection.
      retry: 1,
      retryDelay: 1000,

      // Show stale data while revalidating in the background (SWR pattern)
      // — the UI never shows a loading spinner for cached data.
      placeholderData: (prev: unknown) => prev,
    },
    mutations: {
      retry: 0,
    },
  },
})

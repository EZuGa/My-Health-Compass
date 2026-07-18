import { QueryClient } from "@tanstack/react-query";

// One QueryClient for the whole app session. The router registers its client
// here on creation so non-React code (the api layer) can wipe the cache on
// sign-out or token expiry. In the browser getRouter() runs once, so
// `current` is the app-wide client for the lifetime of the tab.
let current: QueryClient | null = null;

export function createAppQueryClient(): QueryClient {
  current = new QueryClient({
    defaultOptions: {
      queries: {
        // Navigating between pages reuses cached data instead of refetching
        // on every mount; mutations invalidate what they change explicitly.
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
  return current;
}

/** Drop every cached query (sign-out, token expiry, account switch). */
export function clearApiQueryCache() {
  if (!current) return;
  void current.cancelQueries();
  current.clear();
}

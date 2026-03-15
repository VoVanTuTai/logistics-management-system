import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { useAppStore } from './appStore';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      useAppStore
        .getState()
        .setGlobalError(error instanceof Error ? error.message : 'Query failed.');
    },
  }),
  mutationCache: new MutationCache({
    onMutate: () => {
      useAppStore.getState().setGlobalLoading('Dang xu ly...');
    },
    onSettled: () => {
      useAppStore.getState().clearGlobalLoading();
    },
    onError: (error) => {
      useAppStore
        .getState()
        .setGlobalError(
          error instanceof Error ? error.message : 'Mutation failed.',
        );
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

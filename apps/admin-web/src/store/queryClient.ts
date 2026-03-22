import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '../services/api/errors';
import { useUiStore } from './uiStore';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      useUiStore.getState().setGlobalError(getErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onMutate: () => {
      useUiStore.getState().setGlobalLoading('Dang xu ly yeu cau...');
    },
    onError: (error) => {
      useUiStore.getState().setGlobalError(getErrorMessage(error));
    },
    onSettled: () => {
      useUiStore.getState().clearGlobalLoading();
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});


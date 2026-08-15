import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { useAppStore } from './appStore';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      useAppStore
        .getState()
        .setGlobalError(
          error instanceof Error ? error.message : 'Tải dữ liệu thất bại.',
        );
    },
  }),
  mutationCache: new MutationCache({
    onMutate: () => {
      useAppStore.getState().setGlobalLoading('Đang xử lý...');
    },
    onSettled: () => {
      useAppStore.getState().clearGlobalLoading();
    },
    onError: (error) => {
      useAppStore
        .getState()
        .setGlobalError(
          error instanceof Error ? error.message : 'Gửi yêu cầu thất bại.',
        );
    },
  }),
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

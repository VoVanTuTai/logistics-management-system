import { create } from 'zustand';

import type { LoginResultDto } from '../features/auth/auth.types';
import type { OfflineQueuePreviewItem } from '../offline/queue.types';

type AuthStatus = 'booting' | 'authenticated' | 'guest';

interface AppStoreState {
  authStatus: AuthStatus;
  session: LoginResultDto | null;
  globalErrorMessage: string | null;
  globalLoadingMessage: string | null;
  offlinePendingCount: number;
  offlineFailedCount: number;
  offlineQueuePreview: OfflineQueuePreviewItem[];
  offlineSyncing: boolean;
  setGuest: () => void;
  setSession: (session: LoginResultDto) => void;
  clearSession: () => void;
  setGlobalError: (message: string | null) => void;
  clearGlobalError: () => void;
  setGlobalLoading: (message: string | null) => void;
  clearGlobalLoading: () => void;
  setOfflinePendingCount: (count: number) => void;
  setOfflineQueueState: (input: {
    pendingCount: number;
    failedCount: number;
    previewItems: OfflineQueuePreviewItem[];
  }) => void;
  setOfflineSyncing: (isSyncing: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  authStatus: 'booting',
  session: null,
  globalErrorMessage: null,
  globalLoadingMessage: null,
  offlinePendingCount: 0,
  offlineFailedCount: 0,
  offlineQueuePreview: [],
  offlineSyncing: false,
  setGuest: () =>
    set({
      authStatus: 'guest',
      session: null,
    }),
  setSession: (session) =>
    set({
      authStatus: 'authenticated',
      session,
    }),
  clearSession: () =>
    set({
      authStatus: 'guest',
      session: null,
    }),
  setGlobalError: (message) =>
    set({
      globalErrorMessage: message,
    }),
  clearGlobalError: () =>
    set({
      globalErrorMessage: null,
    }),
  setGlobalLoading: (message) =>
    set({
      globalLoadingMessage: message,
    }),
  clearGlobalLoading: () =>
    set({
      globalLoadingMessage: null,
    }),
  setOfflinePendingCount: (count) =>
    set({
      offlinePendingCount: count,
    }),
  setOfflineQueueState: (input) =>
    set({
      offlinePendingCount: input.pendingCount,
      offlineFailedCount: input.failedCount,
      offlineQueuePreview: input.previewItems,
    }),
  setOfflineSyncing: (isSyncing) =>
    set({
      offlineSyncing: isSyncing,
    }),
}));

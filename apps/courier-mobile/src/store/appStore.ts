import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LoginResultDto } from '../features/auth/auth.types';
import type { OfflineQueuePreviewItem } from '../offline/queue.types';
import { DEFAULT_QUICK_APP_IDS } from '../features/quick-apps/quickAppDefaults';

type AuthStatus = 'booting' | 'authenticated' | 'guest';

const QUICK_APP_STORAGE_KEY = 'courier-mobile.quick-app-ids';
const COURIER_AVATAR_STORAGE_KEY = 'courier-mobile.avatar-uri';

function normalizeQuickAppIds(appIds: string[]): string[] {
  return Array.from(
    new Set(appIds.map((appId) => appId.trim()).filter((appId) => appId.length > 0)),
  );
}

async function saveQuickAppIds(appIds: string[]): Promise<void> {
  await AsyncStorage.setItem(QUICK_APP_STORAGE_KEY, JSON.stringify(appIds));
}

function persistQuickAppIds(appIds: string[]): void {
  void saveQuickAppIds(appIds).catch(() => undefined);
}

interface AppStoreState {
  authStatus: AuthStatus;
  session: LoginResultDto | null;
  globalErrorMessage: string | null;
  globalLoadingMessage: string | null;
  offlinePendingCount: number;
  offlineFailedCount: number;
  offlineQueuePreview: OfflineQueuePreviewItem[];
  offlineSyncing: boolean;
  quickAppIds: string[];
  quickAppsHydrated: boolean;
  courierAvatarUri: string | null;
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
  hydrateQuickApps: () => Promise<void>;
  addQuickApp: (appId: string) => void;
  removeQuickApp: (appId: string) => void;
  toggleQuickApp: (appId: string) => void;
  resetQuickApps: () => void;
  hydrateCourierProfile: () => Promise<void>;
  setCourierAvatarUri: (avatarUri: string | null) => void;
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
  quickAppIds: [...DEFAULT_QUICK_APP_IDS],
  quickAppsHydrated: false,
  courierAvatarUri: null,
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
  hydrateQuickApps: async () => {
    try {
      const rawValue = await AsyncStorage.getItem(QUICK_APP_STORAGE_KEY);
      const parsedValue = rawValue ? JSON.parse(rawValue) : null;

      if (Array.isArray(parsedValue)) {
        const appIds = normalizeQuickAppIds(
          parsedValue.filter((item): item is string => typeof item === 'string'),
        );

        set({
          quickAppIds: appIds.length > 0 ? appIds : [...DEFAULT_QUICK_APP_IDS],
          quickAppsHydrated: true,
        });
        return;
      }
    } catch {
      // Keep default shortcuts if local preferences cannot be read.
    }

    set({
      quickAppIds: [...DEFAULT_QUICK_APP_IDS],
      quickAppsHydrated: true,
    });
  },
  addQuickApp: (appId) =>
    set((state) => {
      const nextAppIds = normalizeQuickAppIds([...state.quickAppIds, appId]);
      persistQuickAppIds(nextAppIds);

      return {
        quickAppIds: nextAppIds,
      };
    }),
  removeQuickApp: (appId) =>
    set((state) => {
      if (state.quickAppIds.length <= 1) {
        return {};
      }

      const nextAppIds = state.quickAppIds.filter((currentAppId) => currentAppId !== appId);
      persistQuickAppIds(nextAppIds);

      return {
        quickAppIds: nextAppIds,
      };
    }),
  toggleQuickApp: (appId) =>
    set((state) => {
      const nextAppIds = state.quickAppIds.includes(appId)
        ? state.quickAppIds.length > 1
          ? state.quickAppIds.filter((currentAppId) => currentAppId !== appId)
          : state.quickAppIds
        : normalizeQuickAppIds([...state.quickAppIds, appId]);

      persistQuickAppIds(nextAppIds);

      return {
        quickAppIds: nextAppIds,
      };
    }),
  resetQuickApps: () => {
    persistQuickAppIds([...DEFAULT_QUICK_APP_IDS]);
    set({
      quickAppIds: [...DEFAULT_QUICK_APP_IDS],
    });
  },
  hydrateCourierProfile: async () => {
    try {
      const avatarUri = await AsyncStorage.getItem(COURIER_AVATAR_STORAGE_KEY);
      set({
        courierAvatarUri: avatarUri && avatarUri.trim().length > 0 ? avatarUri : null,
      });
    } catch {
      set({
        courierAvatarUri: null,
      });
    }
  },
  setCourierAvatarUri: (avatarUri) => {
    const normalizedAvatarUri = avatarUri?.trim() || null;

    if (normalizedAvatarUri) {
      void AsyncStorage.setItem(COURIER_AVATAR_STORAGE_KEY, normalizedAvatarUri).catch(
        () => undefined,
      );
    } else {
      void AsyncStorage.removeItem(COURIER_AVATAR_STORAGE_KEY).catch(() => undefined);
    }

    set({
      courierAvatarUri: normalizedAvatarUri,
    });
  },
}));

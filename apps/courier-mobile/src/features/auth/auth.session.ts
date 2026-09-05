import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import type { LoginResultDto } from './auth.types';

const AUTH_SESSION_STORAGE_KEY = 'courier-mobile.auth-session';
declare const require: (moduleName: string) => unknown;

type SecureStoreAdapter = {
  isAvailableAsync?: () => Promise<boolean>;
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

function getSecureStoreAdapter(): SecureStoreAdapter | null {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    return require('expo-secure-store') as SecureStoreAdapter;
  } catch {
    return null;
  }
}

const secureStore = getSecureStoreAdapter();

async function readSessionRaw(): Promise<string | null> {
  if (secureStore) {
    try {
      if (typeof secureStore.isAvailableAsync === 'function') {
        const available = await secureStore.isAvailableAsync().catch(() => false);
        if (available) {
          const val = await secureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
          if (val) return val;
        }
      } else {
        const val = await secureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
        if (val) return val;
      }
    } catch {
      // SecureStore not available or failed on this platform (e.g. Expo Go / Web), fallback to AsyncStorage
    }
  }

  try {
    return await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeSessionRaw(rawValue: string): Promise<void> {
  if (secureStore) {
    try {
      if (typeof secureStore.isAvailableAsync === 'function') {
        const available = await secureStore.isAvailableAsync().catch(() => false);
        if (available) {
          await secureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, rawValue);
          return;
        }
      } else {
        await secureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, rawValue);
        return;
      }
    } catch {
      // SecureStore not available or failed, fallback to AsyncStorage
    }
  }

  try {
    await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, rawValue);
  } catch {
    // ignore
  }
}

async function deleteSessionRaw(): Promise<void> {
  if (secureStore) {
    try {
      if (typeof secureStore.isAvailableAsync === 'function') {
        const available = await secureStore.isAvailableAsync().catch(() => false);
        if (available) {
          await secureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
          return;
        }
      } else {
        await secureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
        return;
      }
    } catch {
      // SecureStore not available or failed, fallback to AsyncStorage
    }
  }

  try {
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function loadStoredAuthSession(): Promise<LoginResultDto | null> {
  const rawValue = await readSessionRaw();

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as LoginResultDto;
  } catch {
    await deleteSessionRaw();
    return null;
  }
}

export async function hydrateAuthSession(): Promise<void> {
  const session = await loadStoredAuthSession();

  if (!session) {
    useAppStore.getState().setGuest();
    return;
  }

  useAppStore.getState().setSession(session);
}

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function persistAuthSession(
  session: LoginResultDto,
): Promise<void> {
  const sessionWithMeta: LoginResultDto = {
    ...session,
    sessionDate: session.sessionDate ?? getTodayDateString(),
    loggedInAt: session.loggedInAt ?? new Date().toISOString(),
    buildId: session.buildId ?? appEnv.buildId,
  };
  await writeSessionRaw(JSON.stringify(sessionWithMeta));
  useAppStore.getState().setSession(sessionWithMeta);
}

export async function clearAuthSession(): Promise<void> {
  await deleteSessionRaw();
  useAppStore.getState().clearSession();
}

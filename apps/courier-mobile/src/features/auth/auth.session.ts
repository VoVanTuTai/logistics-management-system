import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppStore } from '../../store/appStore';
import type { LoginResultDto } from './auth.types';

const AUTH_SESSION_STORAGE_KEY = 'courier-mobile.auth-session';
declare const require: (moduleName: string) => unknown;

type SecureStoreAdapter = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

function getSecureStoreAdapter(): SecureStoreAdapter | null {
  try {
    return require('expo-secure-store') as SecureStoreAdapter;
  } catch {
    return null;
  }
}

const secureStore = getSecureStoreAdapter();

async function readSessionRaw(): Promise<string | null> {
  if (secureStore) {
    return secureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
  }

  // TODO(auth): enforce a secure storage provider in production builds.
  return AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
}

async function writeSessionRaw(rawValue: string): Promise<void> {
  if (secureStore) {
    await secureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, rawValue);
    return;
  }

  // TODO(auth): enforce a secure storage provider in production builds.
  await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, rawValue);
}

async function deleteSessionRaw(): Promise<void> {
  if (secureStore) {
    await secureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  // TODO(auth): enforce a secure storage provider in production builds.
  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
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

export async function persistAuthSession(
  session: LoginResultDto,
): Promise<void> {
  await writeSessionRaw(JSON.stringify(session));
  useAppStore.getState().setSession(session);
}

export async function clearAuthSession(): Promise<void> {
  await deleteSessionRaw();
  useAppStore.getState().clearSession();
}

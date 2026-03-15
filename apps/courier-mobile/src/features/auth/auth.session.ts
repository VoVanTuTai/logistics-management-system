import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppStore } from '../../store/appStore';
import type { LoginResultDto } from './auth.types';

const AUTH_SESSION_STORAGE_KEY = 'courier-mobile.auth-session';

export async function hydrateAuthSession(): Promise<void> {
  const rawValue = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!rawValue) {
    useAppStore.getState().setGuest();
    return;
  }

  try {
    const session = JSON.parse(rawValue) as LoginResultDto;
    useAppStore.getState().setSession(session);
  } catch {
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    useAppStore.getState().setGuest();
  }
}

export async function persistAuthSession(
  session: LoginResultDto,
): Promise<void> {
  await AsyncStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
  useAppStore.getState().setSession(session);
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  useAppStore.getState().clearSession();
}

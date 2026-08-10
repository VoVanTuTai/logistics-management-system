import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfileResponse } from '../services/api/auth.api';

export interface AuthSession {
  accessToken: string;
  user: UserProfileResponse;
}

const STORAGE_KEY = 'NEXUS_CUSTOMER_AUTH_SESSION_V2';

let globalSession: AuthSession | null = null;
let isInitialized = false;
const listeners = new Set<(session: AuthSession | null) => void>();

async function initStorage(): Promise<void> {
  if (isInitialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      globalSession = JSON.parse(raw) as AuthSession;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      const webRaw = window.localStorage.getItem(STORAGE_KEY);
      if (webRaw) {
        globalSession = JSON.parse(webRaw) as AuthSession;
      }
    }
  } catch {
    // Ignore storage init error
  } finally {
    isInitialized = true;
    listeners.forEach((listener) => listener(globalSession));
  }
}

// Trigger initial load
initStorage();

export const authStore = {
  getSession: (): AuthSession | null => globalSession,

  getAccessToken: (): string | null => globalSession?.accessToken ?? null,

  getUser: (): UserProfileResponse | null => globalSession?.user ?? null,

  setSession: (session: AuthSession | null): void => {
    globalSession = session;
    const rawValue = session ? JSON.stringify(session) : null;

    AsyncStorage.setItem(STORAGE_KEY, rawValue ?? '').catch(() => {});
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (rawValue) {
          window.localStorage.setItem(STORAGE_KEY, rawValue);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignore web storage errors
    }

    listeners.forEach((listener) => listener(globalSession));
  },

  logout: (): void => {
    globalSession = null;
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore web storage errors
    }
    listeners.forEach((listener) => listener(null));
  },

  subscribe: (listener: (session: AuthSession | null) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAuthSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(authStore.getSession());

  useEffect(() => {
    const unsubscribe = authStore.subscribe((newSession) => {
      setSession(newSession);
    });
    return unsubscribe;
  }, []);

  return session;
}

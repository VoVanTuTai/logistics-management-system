import { create } from 'zustand';

import type { AuthSessionDto } from '../features/auth/auth.types';

interface AuthStoreState {
  status: 'guest' | 'authenticated' | 'restoring';
  isAuthenticated: boolean;
  session: AuthSessionDto | null;
  isSubmitting: boolean;
  authError: string | null;
  setStatus: (status: AuthStoreState['status']) => void;
  setSubmitting: (value: boolean) => void;
  setAuthError: (message: string | null) => void;
  clearAuthError: () => void;
  setSession: (session: AuthSessionDto) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'guest',
  isAuthenticated: false,
  session: null,
  isSubmitting: false,
  authError: null,
  setStatus: (status) =>
    set({
      status,
    }),
  setSubmitting: (value) =>
    set({
      isSubmitting: value,
    }),
  setAuthError: (message) =>
    set({
      authError: message,
    }),
  clearAuthError: () =>
    set({
      authError: null,
    }),
  setSession: (session) =>
    set({
      status: 'authenticated',
      isAuthenticated: true,
      session,
      authError: null,
    }),
  clearSession: () =>
    set({
      status: 'guest',
      isAuthenticated: false,
      session: null,
      isSubmitting: false,
    }),
}));

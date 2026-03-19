import { useAuthStore } from '../../store/authStore';
import type { AuthSessionDto } from './auth.types';
import { hasAdminRole } from './auth.roles';

const AUTH_STORAGE_KEY = 'admin-web.auth-session';

export async function hydrateAuthSession(): Promise<void> {
  useAuthStore.getState().setStatus('restoring');
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    useAuthStore.getState().setStatus('guest');
    return;
  }

  try {
    const session = JSON.parse(raw) as AuthSessionDto;
    if (!hasAdminRole(session)) {
      throw new Error('Current account has no admin role.');
    }
    // TODO(refresh-flow): verify token expiry and refresh before restoring authenticated session.
    useAuthStore.getState().setSession(session);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setAuthError('Invalid session data. Please login again.');
  } finally {
    if (!useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().setStatus('guest');
    }
  }
}

export async function persistAuthSession(session: AuthSessionDto): Promise<void> {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  useAuthStore.getState().setSession(session);
}

export async function clearAuthSession(): Promise<void> {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  useAuthStore.getState().clearSession();
}

export function getStoredAuthSession(): AuthSessionDto | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSessionDto;
  } catch {
    return null;
  }
}

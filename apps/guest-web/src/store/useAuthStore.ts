import { create } from 'zustand';

export interface CustomerUser {
  id: string;
  username: string;
  displayName: string | null;
  phone: string | null;
  roles: string[];
}

interface AuthState {
  phone: string | null;
  token: string | null;
  user: CustomerUser | null;
  login: (phone: string, token: string, user?: CustomerUser | null) => void;
  logout: () => void;
}

const STORAGE_KEY = 'nexus_guest_auth';

function loadInitialState(): { phone: string | null; token: string | null; user: CustomerUser | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        phone: parsed.phone || null,
        token: parsed.token || null,
        user: parsed.user || null,
      };
    }
  } catch {}
  return { phone: null, token: null, user: null };
}

const initialState = loadInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  phone: initialState.phone,
  token: initialState.token,
  user: initialState.user,
  login: (phone, token, user) => {
    const resolvedUser: CustomerUser = user || {
      id: phone,
      username: phone,
      displayName: phone,
      phone,
      roles: ['CUSTOMER'],
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone, token, user: resolvedUser }));
    } catch {}
    set({ phone, token, user: resolvedUser });
  },
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ phone: null, token: null, user: null });
  },
}));

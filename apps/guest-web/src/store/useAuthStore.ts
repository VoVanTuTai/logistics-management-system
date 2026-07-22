import { create } from 'zustand';

interface AuthState {
  phone: string | null;
  token: string | null;
  login: (phone: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  phone: null,
  token: null,
  login: (phone, token) => set({ phone, token }),
  logout: () => set({ phone: null, token: null }),
}));

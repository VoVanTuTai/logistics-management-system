import { create } from 'zustand';

interface UiStoreState {
  globalError: string | null;
  globalLoading: string | null;
  setGlobalError: (message: string | null) => void;
  clearGlobalError: () => void;
  setGlobalLoading: (message: string | null) => void;
  clearGlobalLoading: () => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  globalError: null,
  globalLoading: null,
  setGlobalError: (message) =>
    set({
      globalError: message,
    }),
  clearGlobalError: () =>
    set({
      globalError: null,
    }),
  setGlobalLoading: (message) =>
    set({
      globalLoading: message,
    }),
  clearGlobalLoading: () =>
    set({
      globalLoading: null,
    }),
}));


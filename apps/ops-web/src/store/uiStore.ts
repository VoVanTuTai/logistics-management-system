import { create } from 'zustand';

export type UiToastType = 'success' | 'error' | 'info';

export interface UiToast {
  id: number;
  type: UiToastType;
  message: string;
}

interface UiStoreState {
  globalError: string | null;
  globalLoading: string | null;
  toasts: UiToast[];
  setGlobalError: (message: string | null) => void;
  clearGlobalError: () => void;
  setGlobalLoading: (message: string | null) => void;
  clearGlobalLoading: () => void;
  showToast: (message: string, type?: UiToastType) => number;
  dismissToast: (toastId: number) => void;
}

let nextToastId = 1;

export const useUiStore = create<UiStoreState>((set) => ({
  globalError: null,
  globalLoading: null,
  toasts: [],
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
  showToast: (message, type = 'info') => {
    const toastId = nextToastId;
    nextToastId += 1;

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: toastId,
          type,
          message,
        },
      ],
    }));

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== toastId),
      }));
    }, 5000);

    return toastId;
  },
  dismissToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
}));

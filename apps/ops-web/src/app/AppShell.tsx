import React from 'react';

import { useUiStore } from '../store/uiStore';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const globalError = useUiStore((state) => state.globalError);
  const globalLoading = useUiStore((state) => state.globalLoading);
  const toasts = useUiStore((state) => state.toasts);
  const clearGlobalError = useUiStore((state) => state.clearGlobalError);
  const dismissToast = useUiStore((state) => state.dismissToast);

  return (
    <div className="app-root-shell">
      {globalError ? (
        <button type="button" onClick={clearGlobalError} className="global-banner global-banner-error">
          {globalError}
        </button>
      ) : null}
      {globalLoading ? (
        <div className="global-banner global-banner-info">{globalLoading}</div>
      ) : null}
      {toasts.length > 0 ? (
        <div className="global-toast-stack" aria-live="polite" aria-label="Thông báo hệ thống">
          {toasts.map((toast) => (
            <button
              key={toast.id}
              type="button"
              className={`global-toast global-toast-${toast.type}`}
              onClick={() => dismissToast(toast.id)}
            >
              <span className="global-toast-icon" aria-hidden="true">
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}
              </span>
              <span>{toast.message}</span>
              <span className="global-toast-close" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="app-root-content">{children}</div>
    </div>
  );
}
